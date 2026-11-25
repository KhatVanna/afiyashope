<?php

namespace App\Support;

class SiteSettingsDefaults
{
    /**
     * @return array<string, array<string, mixed>>
     */
    public static function groups(): array
    {
        return [
            'branding' => [
                'logo_light' => '/images/afiyashope_logo.png',
                'logo_dark' => null,
                'favicon' => '/images/afiya-icon.png',
                'primary_color' => '#21A8D8',
                'secondary_color' => '#F9318D',
            ],
            'contact' => [
                'phone' => '',
                'whatsapp_url' => '',
                'email' => '',
                'address_km' => '',
                'address_en' => '',
                'map_url' => '',
                'facebook_url' => 'https://www.facebook.com/share/1E66nep5tC/?mibextid=wwXIfr',
                'instagram_url' => 'https://instagram.com',
                'tiktok_url' => 'https://tiktok.com',
                'telegram_url' => 'https://t.me/',
                'business_hours_km' => '',
                'business_hours_en' => '',
            ],
            'footer' => [
                'about_km' => 'Abaya Collection • បោះដុំ និងលក់រាយ ២៥ ខេត្ត-ក្រុង',
                'about_en' => 'Abaya Collection • Wholesale and retail across Cambodia',
                'quick_links' => [
                    ['label_km' => 'ទំព័រដើម', 'label_en' => 'Home', 'url' => '/'],
                    ['label_km' => 'ទិញទំនិញ', 'label_en' => 'Shop', 'url' => '/products'],
                    ['label_km' => 'ប្រភេទទំនិញ', 'label_en' => 'Categories', 'url' => '/categories'],
                    ['label_km' => 'ទំនាក់ទំនង', 'label_en' => 'Contact', 'url' => '/contact'],
                ],
                'policy_links' => [
                    'privacy' => '/privacy',
                    'returns' => '/refunds',
                    'shipping' => '/shipping',
                    'terms' => '/terms',
                ],
                'payment_methods' => [
                    'aba' => true,
                    'acleda' => false,
                    'wing' => false,
                    'khqr' => true,
                    'cash_on_delivery' => false,
                ],
                'copyright_km' => '',
                'copyright_en' => 'Afiya Shope. Luxury Abaya Boutique',
            ],
            'seo' => [
                'site_title_km' => 'Afiya Shope | ហាង Abaya ប្រណិត',
                'site_title_en' => 'Afiya Shope | Luxury Abaya Boutique',
                'meta_description_km' => 'ស្វែងរកម៉ូដ Abaya ទាន់សម័យ និងប្រណិតភាពពី Afiya Shope។',
                'meta_description_en' => 'Discover elegant Abaya styles at Afiya Shope.',
                'og_image' => '/images/afiyashope_logo.png',
                'keywords' => [],
                'google_analytics_id' => '',
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public static function defaultBanner(): array
    {
        return [
            'media_type' => 'video',
            'media_url' => '/videos/TVC.mp4',
            'mobile_media_url' => null,
            'poster_url' => '/videos/TVC-poster.jpg',
            'eyebrow_km' => '✨ ម៉ូដថ្មីឆ្នាំ ២០២៦',
            'eyebrow_en' => '✨ NEW COLLECTION 2026',
            'headline_km' => 'ម៉ូដ Abaya ទាន់សម័យ',
            'headline_en' => 'Elegant Abaya Styles',
            'subtitle_km' => 'សុភាពរាបសារ និងប្រណិតភាព • សាច់ក្រណាត់នាំចូលគុណភាពខ្ពស់',
            'subtitle_en' => 'Modest elegance in premium imported fabrics.',
            'button_text_km' => 'ឆាតសួរព័ត៌មាន FB Page',
            'button_text_en' => 'Chat with us on Facebook',
            'button_url' => 'https://www.facebook.com/share/1E66nep5tC/?mibextid=wwXIfr',
            'text_align' => 'left',
            'overlay_opacity' => 40,
            'is_active' => true,
            'sort_order' => 0,
            'starts_at' => null,
            'ends_at' => null,
        ];
    }
}
