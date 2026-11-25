<?php

namespace App\Console\Commands;

use App\Models\Product;
use App\Services\CloudinaryService;
use App\Support\CatalogCache;
use App\Support\DatabaseTargetGuard;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class RemoveDemoProducts extends Command
{
    protected $signature = 'products:remove-demo
                            {--dry-run : Show the demo products and images without deleting}
                            {--allow-remote : Permit a non-local database after a separate approval}';

    protected $description = 'Permanently remove demo products, their image records, and Cloudinary assets.';

    public function __construct(private readonly CloudinaryService $cloudinary)
    {
        parent::__construct();
    }

    public function handle(): int
    {
        if (DatabaseTargetGuard::isRemote()
            && ! $this->option('allow-remote')) {
            $this->error('Refusing to access a non-local database. Use --allow-remote only after separate approval.');

            return self::FAILURE;
        }

        $products = Product::withTrashed()
            ->where('is_demo', true)
            ->with('images')
            ->get();
        $imageCount = $products->sum(fn (Product $product): int => $product->images->count());

        if ($this->option('dry-run')) {
            $this->info(sprintf(
                'Dry run: found %d demo product(s) and %d image record(s); nothing deleted.',
                $products->count(),
                $imageCount,
            ));

            return self::SUCCESS;
        }

        if ($products->isEmpty()) {
            $this->info('No demo products found.');

            return self::SUCCESS;
        }

        if (! $this->confirm(sprintf(
            'Permanently delete %d demo product(s), %d image record(s), and their Cloudinary files?',
            $products->count(),
            $imageCount,
        ), false)) {
            $this->info('Cancelled; no demo products were changed.');

            return self::SUCCESS;
        }

        foreach ($products as $product) {
            foreach ($product->images as $image) {
                $publicId = $image->cloudinary_public_id
                    ?: $this->cloudinary->extractPublicIdFromUrl($image->url ?: $image->path);

                if ($publicId !== null && ! $this->cloudinary->destroy($publicId)) {
                    throw new RuntimeException('Cloudinary deletion failed; demo database records were retained.');
                }
            }
        }

        DB::transaction(function () use ($products): void {
            foreach ($products as $product) {
                $product->images()->delete();
                $product->forceDelete();
            }
        });

        CatalogCache::bust();
        $this->info(sprintf(
            'Removed %d demo product(s), %d image record(s), and their Cloudinary assets.',
            $products->count(),
            $imageCount,
        ));

        return self::SUCCESS;
    }
}
