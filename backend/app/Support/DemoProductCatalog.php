<?php

namespace App\Support;

class DemoProductCatalog
{
    /**
     * @return list<array{model: int, product_key: string, display_name: string, tag: string, photo_count: int}>
     */
    public static function products(): array
    {
        return [
            ['model' => 1, 'product_key' => '133336', 'display_name' => 'Nike Black Training T-Shirt', 'tag' => 'luxury', 'photo_count' => 4],
            ['model' => 2, 'product_key' => '4097163', 'display_name' => 'Nike Grey Full-Zip Tracksuit', 'tag' => 'set', 'photo_count' => 4],
            ['model' => 3, 'product_key' => '4128307', 'display_name' => 'Nike Navy Training T-Shirt', 'tag' => 'luxury', 'photo_count' => 4],
            ['model' => 4, 'product_key' => '4129484', 'display_name' => 'Nike Heathered Purple Training T-Shirt', 'tag' => 'pastel', 'photo_count' => 4],
            ['model' => 5, 'product_key' => '04408881250', 'display_name' => "Men's White Formal Shirt", 'tag' => 'luxury', 'photo_count' => 5],
            ['model' => 6, 'product_key' => 'adidas_2006_TEAMGEIST_jersey_Black_KE0688', 'display_name' => 'Adidas 2006 Teamgeist Jersey Black', 'tag' => 'luxury', 'photo_count' => 5],
            ['model' => 7, 'product_key' => 'ALL_SZN_Tee_Black_IY4150', 'display_name' => 'Adidas All SZN Tee Black', 'tag' => 'luxury', 'photo_count' => 5],
            ['model' => 8, 'product_key' => 'ALL_SZN_Tee_White_KC3184', 'display_name' => 'Adidas All SZN Tee White', 'tag' => 'luxury', 'photo_count' => 1],
            ['model' => 9, 'product_key' => 'ANSD_1003_FRONT_HO23_Nike-Strength-Hoodie-Black-White', 'display_name' => 'Nike Strength Hoodie Black/White', 'tag' => 'luxury', 'photo_count' => 1],
            ['model' => 10, 'product_key' => 'Archive_Africa_94_Graphic_Tee_Black_KC7920', 'display_name' => 'Adidas Archive Africa 94 Graphic Tee Black', 'tag' => 'luxury', 'photo_count' => 5],
            ['model' => 11, 'product_key' => 'Argentina_26_Away_Jersey_Black_JM8395', 'display_name' => 'Argentina 26 Away Jersey Black', 'tag' => 'luxury', 'photo_count' => 5],
            ['model' => 12, 'product_key' => 'Argentina_Track_Pants_2006_Black_JZ6200', 'display_name' => 'Argentina Track Pants 2006 Black', 'tag' => 'luxury', 'photo_count' => 5],
            ['model' => 13, 'product_key' => 'AS+M+NSW+PREM+ESSNTL+SUST+TEE', 'display_name' => 'Nike Premium Essentials Sustainable Tee', 'tag' => 'luxury', 'photo_count' => 4],
            ['model' => 14, 'product_key' => 'Germany_26_Home_Pre_Match_Jersey_Black_JZ4577', 'display_name' => 'Germany 26 Home Pre-Match Jersey', 'tag' => 'luxury', 'photo_count' => 5],
            ['model' => 15, 'product_key' => 'Graphic_Aop_Short_Sleeve_Polo_Shirts_Black_JN1225', 'display_name' => 'Nike Graphic AOP Short-Sleeve Polo Black', 'tag' => 'luxury', 'photo_count' => 5],
            ['model' => 16, 'product_key' => 'Graphic_Aop_Short_Sleeve_Polo_Shirts_Green_JL7942', 'display_name' => 'Nike Graphic AOP Short-Sleeve Polo Green', 'tag' => 'luxury', 'photo_count' => 1],
            ['model' => 17, 'product_key' => 'Graphics-Speedcat-Relaxed-Tee-Men', 'display_name' => 'Puma Graphics Speedcat Relaxed Tee', 'tag' => 'luxury', 'photo_count' => 5],
            ['model' => 18, 'product_key' => 'JI8858', 'display_name' => 'Adidas Black 3-Stripes Tracksuit', 'tag' => 'set', 'photo_count' => 5],
            ['model' => 19, 'product_key' => 'LOOSE_GRAPHIC_TEE_COLLEGIATE_11_Black_IA4482', 'display_name' => 'Adidas Collegiate Graphic Tee Black', 'tag' => 'luxury', 'photo_count' => 5],
            ['model' => 20, 'product_key' => 'LOOSE_GRAPHIC_TEE_COLLEGIATE_11_Green_IA4481', 'display_name' => 'Adidas Collegiate Graphic Tee Green', 'tag' => 'luxury', 'photo_count' => 1],
            ['model' => 21, 'product_key' => 'mt41506dae', 'display_name' => 'New Balance Green Athletic Crewneck Sweatshirt', 'tag' => 'luxury', 'photo_count' => 5],
            ['model' => 22, 'product_key' => 'mt51673ahh', 'display_name' => 'New Balance White Heritage Graphic Sweatshirt', 'tag' => 'luxury', 'photo_count' => 5],
            ['model' => 23, 'product_key' => 'NIKE+JOURNEY+RUN', 'display_name' => 'Nike Journey Run Shoe', 'tag' => 'luxury', 'photo_count' => 1],
            ['model' => 24, 'product_key' => 'Own_the_Run_Leggings_Black_HM8444', 'display_name' => 'Nike Own the Run Leggings Black', 'tag' => 'luxury', 'photo_count' => 5],
            ['model' => 25, 'product_key' => 'Teamgeist_Adicolor_Track_Top_Black_KD5858', 'display_name' => 'Adidas Teamgeist Adicolor Track Top Black', 'tag' => 'luxury', 'photo_count' => 5],
            ['model' => 26, 'product_key' => 'Z.N.E._Full-Zip_Hooded_Track_Jacket_Black_JE7538', 'display_name' => 'Adidas Z.N.E. Full-Zip Hooded Track Jacket Black', 'tag' => 'luxury', 'photo_count' => 5],
            ['model' => 27, 'product_key' => 'Z.N.E._Full-Zip_Hooded_Track_Jacket_Brown_KC7904', 'display_name' => 'Adidas Z.N.E. Full-Zip Hooded Track Jacket Brown', 'tag' => 'pastel', 'photo_count' => 1],
            ['model' => 28, 'product_key' => 'ZaraMen_sFlowyPleatedShorts', 'display_name' => "Zara Men's Flowy Pleated Shorts", 'tag' => 'luxury', 'photo_count' => 5],
            ['model' => 29, 'product_key' => 'ZaraMen_sRibCollarT-Shirt_Yellow', 'display_name' => "Zara Men's Rib Collar T-Shirt Yellow", 'tag' => 'pastel', 'photo_count' => 5],
        ];
    }
}
