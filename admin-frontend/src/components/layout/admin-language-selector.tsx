"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import { Check } from "@/components/ui/emoji-icons";

const LANGUAGE_STORAGE_KEY = "afiya-admin-language";
const LANGUAGE_CHANGE_EVENT = "afiya-admin-language-change";

export type AdminLanguage = "en" | "km";

const ADMIN_KHMER_TRANSLATIONS: Record<string, string> = {
  "Dashboard": "ផ្ទាំងគ្រប់គ្រង",
  "Products": "ផលិតផល",
  "Categories": "ប្រភេទ",
  "Brands": "ម៉ាក",
  "Orders": "ការបញ្ជាទិញ",
  "Customers": "អតិថិជន",
  "Reports": "របាយការណ៍",
  "Site Settings": "ការកំណត់គេហទំព័រ",
  "Users & Roles": "អ្នកប្រើប្រាស់ និងតួនាទី",
  "Settings": "ការកំណត់",
  "Home": "ទំព័រដើម",
  "Restoring session...": "កំពុងស្តារសម័យចូលប្រើ...",
  "Redirecting to sign in...": "កំពុងបញ្ជូនទៅកាន់ការចូលគណនី...",
  "Close menu overlay": "បិទផ្ទាំងម៉ឺនុយ",
  "Expand sidebar": "ពង្រីករបារចំហៀង",
  "Collapse sidebar": "បង្រួមរបារចំហៀង",
  "Close sidebar": "បិទរបារចំហៀង",
  "Open sidebar": "បើករបារចំហៀង",
  "Search products, orders, customers...": "ស្វែងរកផលិតផល ការបញ្ជាទិញ អតិថិជន...",
  "Appearance": "រូបរាង",
  "Light": "របៀបភ្លឺ",
  "Dark": "របៀបងងឹត",
  "System": "ប្រព័ន្ធ",
  "Notifications": "ការជូនដំណឹង",
  "Account menu": "ម៉ឺនុយគណនី",
  "Account links": "តំណភ្ជាប់គណនី",
  "Sign out": "ចាកចេញ",
  "Staff": "បុគ្គលិក",
  "Admin": "អ្នកគ្រប់គ្រង",
  "Super Admin": "អ្នកគ្រប់គ្រងជាន់ខ្ពស់",
  "Search": "ស្វែងរក",
  "Opening admin…": "កំពុងបើកប្រព័ន្ធគ្រប់គ្រង...",
  "Jan": "មករា",
  "Feb": "កុម្ភៈ",
  "Mar": "មីនា",
  "Apr": "មេសា",
  "May": "ឧសភា",
  "Jun": "មិថុនា",
  "Jul": "កក្កដា",
  "High": "ខ្ពស់",
  "Medium": "មធ្យម",
  "Low": "ទាប",
  "Critical": "ធ្ងន់ធ្ងរ",
  "Payment received from Alice Nguyen": "បានទទួលការទូទាត់ពី Alice Nguyen",
  "New order recorded": "បានកត់ត្រាការបញ្ជាទិញថ្មី",
  "Refund processed for Michael": "បានដំណើរការសងប្រាក់ជូន Michael",
  "New sale recorded": "បានកត់ត្រាការលក់ថ្មី",
  "Payment completed": "បានបញ្ចប់ការទូទាត់",
  "Wireless Noise Cancelling Headphones": "កាសស្តាប់ត្រចៀកកាត់បន្ថយសំឡេងរំខាន",
  "Smart Kitchen Scale Pro": "ជញ្ជីងផ្ទះបាយឆ្លាតវៃ Pro",
  "Travel Backpack 30L": "កាបូបស្ពាយធ្វើដំណើរ 30L",
  "USB-C Hub Multiport Adapter": "អាដាប់ទ័រ USB-C ច្រើនរន្ធ",
  "Kids STEM Robot Kit": "ឈុតមនុស្សយន្ត STEM សម្រាប់កុមារ",
  "Welcome back!": "សូមស្វាគមន៍មកវិញ!",
  "Check your store reports, orders, and catalog performance.": "ពិនិត្យរបាយការណ៍ហាង ការបញ្ជាទិញ និងប្រសិទ្ធភាពកាតាឡុករបស់អ្នក។",
  "View orders": "មើលការបញ្ជាទិញ",
  "Open reports": "បើករបាយការណ៍",
  "Today": "ថ្ងៃនេះ",
  "Awaiting fulfillment": "កំពុងរង់ចាំការបំពេញការបញ្ជាទិញ",
  "Revenue": "ចំណូល",
  "Low Stock": "ស្តុកជិតអស់",
  "Revenue Updates": "បច្ចុប្បន្នភាពចំណូល",
  "Overview of sales vs profit": "ទិដ្ឋភាពទូទៅនៃការលក់ និងប្រាក់ចំណេញ",
  "Sales": "ការលក់",
  "Profit": "ប្រាក់ចំណេញ",
  "Yearly Breakup": "សេចក្តីសង្ខេបប្រចាំឆ្នាំ",
  "Monthly Earnings": "ចំណូលប្រចាំខែ",
  "last year": "ឆ្នាំមុន",
  "last month": "ខែមុន",
  "Recent Transactions": "ប្រតិបត្តិការថ្មីៗ",
  "Latest store activity": "សកម្មភាពថ្មីៗរបស់ហាង",
  "Product Performance": "ប្រសិទ្ធភាពផលិតផល",
  "Top catalog movers this period": "ផលិតផលកំពូលក្នុងរយៈពេលនេះ",
  "View all": "មើលទាំងអស់",
  "Id": "លេខសម្គាល់",
  "Name": "ឈ្មោះ",
  "Priority": "អាទិភាព",
  "What you can manage here": "អ្វីដែលអ្នកអាចគ្រប់គ្រងនៅទីនេះ",
  "You do not have access to this module.": "អ្នកមិនមានសិទ្ធិចូលប្រើម៉ូឌុលនេះទេ។",
  "UI shell is ready. Connected CRUD screens will plug into the Laravel API next.": "ផ្ទាំងគ្រប់គ្រងរួចរាល់។ អេក្រង់គ្រប់គ្រងទិន្នន័យនឹងភ្ជាប់ទៅ Laravel API នៅពេលក្រោយ។",
  "Back to dashboard": "ត្រឡប់ទៅផ្ទាំងគ្រប់គ្រង",
  "Redirecting to dashboard...": "កំពុងបញ្ជូនទៅផ្ទាំងគ្រប់គ្រង...",
  "Admin sign in": "ចូលប្រព័ន្ធគ្រប់គ្រង",
  "Email": "អ៊ីមែល",
  "Password": "ពាក្យសម្ងាត់",
  "Enter a valid email": "សូមបញ្ចូលអ៊ីមែលត្រឹមត្រូវ",
  "Password is required": "សូមបញ្ចូលពាក្យសម្ងាត់",
  "Unable to sign in with these credentials.": "មិនអាចចូលគណនីដោយប្រើព័ត៌មាននេះបានទេ។",
  "Unable to reach the authentication server.": "មិនអាចភ្ជាប់ទៅម៉ាស៊ីនមេផ្ទៀងផ្ទាត់គណនីបានទេ។",
  "The authentication service is temporarily unavailable. Please try again shortly.": "សេវាផ្ទៀងផ្ទាត់គណនីមិនអាចប្រើបានជាបណ្តោះអាសន្នទេ។ សូមព្យាយាមម្តងទៀតនៅពេលបន្តិចទៀត។",
  "Signing in...": "កំពុងចូលគណនី...",
  "Sign in": "ចូលគណនី",
  "Search by name, SKU, or slug...": "ស្វែងរកតាមឈ្មោះ SKU ឬ slug...",
  "Search by name, email, or phone...": "ស្វែងរកតាមឈ្មោះ អ៊ីមែល ឬលេខទូរស័ព្ទ...",
  "Search order #, email, phone, customer...": "ស្វែងរកលេខបញ្ជាទិញ អ៊ីមែល ទូរស័ព្ទ ឬអតិថិជន...",
  "Search by name or SKU...": "ស្វែងរកតាមឈ្មោះ ឬ SKU...",
  "All categories": "គ្រប់ប្រភេទ",
  "All brands": "គ្រប់ម៉ាក",
  "All roles": "គ្រប់តួនាទី",
  "All status": "គ្រប់ស្ថានភាព",
  "All statuses": "គ្រប់ស្ថានភាព",
  "All payments": "គ្រប់ការបង់ប្រាក់",
  "Active": "សកម្ម",
  "Inactive": "អសកម្ម",
  "Featured": "ពិសេស",
  "Low stock": "ស្តុកតិច",
  "Out of stock": "អស់ពីស្តុក",
  "All products": "គ្រប់ផលិតផល",
  "With sales in period": "មានការលក់ក្នុងរយៈពេលនេះ",
  "No sales in period": "គ្មានការលក់ក្នុងរយៈពេលនេះ",
  "Product": "ផលិតផល",
  "SKU": "SKU",
  "Category": "ប្រភេទ",
  "Price": "តម្លៃ",
  "Stock": "ស្តុក",
  "Status": "ស្ថានភាព",
  "Actions": "សកម្មភាព",
  "Action": "សកម្មភាព",
  "Phone": "ទូរស័ព្ទ",
  "Role": "តួនាទី",
  "Created": "បានបង្កើត",
  "User": "អ្នកប្រើប្រាស់",
  "Customer": "អតិថិជន",
  "Addresses": "អាសយដ្ឋាន",
  "Joined": "បានចូលរួម",
  "Placed": "បានដាក់",
  "Items": "មុខទំនិញ",
  "Total": "សរុប",
  "Payment": "ការបង់ប្រាក់",
  "Order": "ការបញ្ជាទិញ",
  "Date": "កាលបរិច្ឆេទ",
  "View": "មើល",
  "Edit": "កែសម្រួល",
  "Delete": "លុប",
  "Close": "បិទ",
  "Cancel": "បោះបង់",
  "Save": "រក្សាទុក",
  "Save changes": "រក្សាទុកការផ្លាស់ប្តូរ",
  "Saving...": "កំពុងរក្សាទុក...",
  "Retry": "ព្យាយាមម្តងទៀត",
  "No settings found.": "រកមិនឃើញការកំណត់ទេ។",
  "No permissions assigned.": "មិនទាន់បានកំណត់សិទ្ធិទេ។",
  "No address on file.": "មិនមានអាសយដ្ឋានទេ។",
  "Storefront controls": "ការគ្រប់គ្រងហាង",
  "Manage the banners, branding, contact details, footer, and SEO shown on the public store.": "គ្រប់គ្រងបដា ម៉ាក ព័ត៌មានទំនាក់ទំនង បាតទំព័រ និង SEO ដែលបង្ហាញលើហាង។",
  "Only Admin and Super Admin roles can manage site settings.": "មានតែអ្នកគ្រប់គ្រង និងអ្នកគ្រប់គ្រងជាន់ខ្ពស់ប៉ុណ្ណោះដែលអាចគ្រប់គ្រងការកំណត់គេហទំព័របាន។",
  "Banners": "បដា",
  "Branding": "ម៉ាកយីហោ",
  "Contact & Social": "ទំនាក់ទំនង និងបណ្តាញសង្គម",
  "Footer": "បាតទំព័រ",
  "SEO": "SEO",
  "Hero banners": "បដាផ្នែកដើម",
  "Reorder, schedule, and preview the storefront hero banners.": "រៀបលំដាប់ កំណត់ពេល និងមើលជាមុននូវបដាផ្នែកដើមរបស់ហាង។",
  "Add banner": "បន្ថែមបដា",
  "No banners yet. Add one to configure the storefront hero.": "មិនទាន់មានបដាទេ។ បន្ថែមបដាដើម្បីកំណត់ផ្នែកដើមរបស់ហាង។",
  "You have unsaved changes. Use Save changes in each edited section before leaving the page.": "អ្នកមានការផ្លាស់ប្តូរដែលមិនទាន់រក្សាទុក។ សូមរក្សាទុកការផ្លាស់ប្តូរនៅផ្នែកនីមួយៗមុនពេលចាកចេញ។",
  "Unsaved changes": "ការផ្លាស់ប្តូរមិនទាន់រក្សាទុក",
  "Discard": "បោះបង់ការផ្លាស់ប្តូរ",
  "Save banners": "រក្សាទុកបដា",
  "Site settings saved.": "បានរក្សាទុកការកំណត់គេហទំព័រ។",
  "Loading site settings...": "កំពុងផ្ទុកការកំណត់គេហទំព័រ...",
  "Site settings are unavailable until the API responds.": "ការកំណត់គេហទំព័រមិនអាចប្រើបានទេ រហូតដល់ API ឆ្លើយតប។",
  "Light logo": "ឡូហ្គោសម្រាប់ផ្ទៃភ្លឺ",
  "Dark logo (optional)": "ឡូហ្គោសម្រាប់ផ្ទៃងងឹត (ជាជម្រើស)",
  "Favicon": "រូបតំណាងគេហទំព័រ",
  "Primary color": "ពណ៌ចម្បង",
  "Secondary color": "ពណ៌បន្ទាប់បន្សំ",
  "Choose storefront logos, favicon, and brand colors.": "ជ្រើសរើសឡូហ្គោ រូបតំណាងគេហទំព័រ និងពណ៌ម៉ាករបស់ហាង។",
  "Contact details and social profiles shown to customers.": "ព័ត៌មានទំនាក់ទំនង និងគណនីបណ្តាញសង្គមដែលបង្ហាញដល់អតិថិជន។",
  "Quick links": "តំណភ្ជាប់រហ័ស",
  "Policy links": "តំណភ្ជាប់គោលការណ៍",
  "Payment methods": "វិធីបង់ប្រាក់",
  "Live preview": "មើលផ្ទាល់",
  "Preview updates as you edit; it is not published until saved.": "ការមើលជាមុននឹងអាប់ដេតពេលកែសម្រួល ហើយមិនទាន់ផ្សព្វផ្សាយរហូតដល់រក្សាទុក។",
  "Desktop": "កុំព្យូទ័រ",
  "Mobile": "ទូរស័ព្ទ",
  "Headline": "ចំណងជើង",
  "Subtitle": "ចំណងជើងរង",
  "Button text": "អត្ថបទប៊ូតុង",
  "English": "អង់គ្លេស",
  "Khmer": "ខ្មែរ",
  "Slug": "Slug",
  "Compare at price": "តម្លៃប្រៀបធៀប",
  "Cost price": "ថ្លៃដើម",
  "Stock quantity": "ចំនួនក្នុងស្តុក",
  "No category": "គ្មានប្រភេទ",
  "No brand": "គ្មានម៉ាក",
  "Manage product brands, logos, and visibility.": "គ្រប់គ្រងម៉ាកផលិតផល ឡូហ្គោ និងការបង្ហាញ។",
  "Add brand": "បន្ថែមម៉ាក",
  "Loading brands...": "កំពុងផ្ទុកម៉ាក...",
  "Unable to load brands.": "មិនអាចផ្ទុកម៉ាកបានទេ។",
  "No brands found.": "រកមិនឃើញម៉ាកទេ។",
  "Brand name": "ឈ្មោះម៉ាក",
  "Product count": "ចំនួនផលិតផល",
  "Products assigned; cannot delete.": "មានផលិតផលភ្ជាប់ ដូច្នេះមិនអាចលុបបានទេ។",
  "Logo": "ឡូហ្គោ",
  "Upload logo": "បង្ហោះឡូហ្គោ",
  "Logo must be JPG, PNG, or WebP and no more than 2 MB.": "ឡូហ្គោត្រូវជា JPG, PNG ឬ WebP ហើយមានទំហំមិនលើស 2 MB។",
  "Sort order": "លំដាប់តម្រៀប",
  "Save brand": "រក្សាទុកម៉ាក",
  "Creating...": "កំពុងបង្កើត...",
  "Brand created.": "បានបង្កើតម៉ាក។",
  "Brand updated.": "បានធ្វើបច្ចុប្បន្នភាពម៉ាក។",
  "Brand deleted.": "បានលុបម៉ាក។",
  "Brand status updated.": "បានធ្វើបច្ចុប្បន្នភាពស្ថានភាពម៉ាក។",
  "Unable to save brand.": "មិនអាចរក្សាទុកម៉ាកបានទេ។",
  "Unable to delete brand.": "មិនអាចលុបម៉ាកបានទេ។",
  "Unable to update brand status.": "មិនអាចធ្វើបច្ចុប្បន្នភាពស្ថានភាពម៉ាកបានទេ។",
  "Brand details were saved, but the logo upload failed.": "បានរក្សាទុកព័ត៌មានម៉ាក ប៉ុន្តែការបង្ហោះឡូហ្គោបានបរាជ័យ។",
  "Unable to process logo image.": "មិនអាចដំណើរការរូបឡូហ្គោបានទេ។",
  "Delete this brand? Products will remain but will no longer be assigned to it.": "លុបម៉ាកនេះឬ? ផលិតផលនឹងនៅដដែល ប៉ុន្តែមិនភ្ជាប់ជាមួយម៉ាកនេះទៀតទេ។",
  "Edit brand": "កែសម្រួលម៉ាក",
  "Create brand": "បង្កើតម៉ាក",
  "The brand logo is optional.": "ឡូហ្គោម៉ាកគឺជាជម្រើស។",
  "Brand name is required.": "ត្រូវបញ្ចូលឈ្មោះម៉ាក។",
  "Activate": "ដាក់ឱ្យសកម្ម",
  "Deactivate": "បិទសកម្មភាព",
  "Compressing...": "កំពុងបង្រួម...",
  "Short description": "ការពិពណ៌នាខ្លី",
  "Description": "ការពិពណ៌នា",
  "Meta title": "ចំណងជើង Meta",
  "Meta description": "ការពិពណ៌នា Meta",
  "Track inventory": "តាមដានស្តុក",
  "Featured product": "ផលិតផលពិសេស",
  "No users found.": "រកមិនឃើញអ្នកប្រើប្រាស់ទេ។",
  "No customers found.": "រកមិនឃើញអតិថិជនទេ។",
  "No products found.": "រកមិនឃើញផលិតផលទេ។",
  "No orders found.": "រកមិនឃើញការបញ្ជាទិញទេ។",
  "Previous": "មុន",
  "Next": "បន្ទាប់",
  "View storefront customer accounts, addresses, and order history.": "មើលគណនីអតិថិជន អាសយដ្ឋាន និងប្រវត្តិការបញ្ជាទិញនៅលើហាង។",
  "customers": "អតិថិជន",
  "Loading customers...": "កំពុងផ្ទុកអតិថិជន...",
  "Page": "ទំព័រ",
  "of": "នៃ",
  "Loading customer details...": "កំពុងផ្ទុកព័ត៌មានអតិថិជន...",
  "Account details": "ព័ត៌មានគណនី",
  "Active account": "គណនីសកម្ម",
  "No addresses on file.": "មិនមានអាសយដ្ឋានទេ។",
  "Default": "លំនាំដើម",
  "Recent orders": "ការបញ្ជាទិញថ្មីៗ",
  "No orders yet.": "មិនទាន់មានការបញ្ជាទិញទេ។",
  "Track customer orders, update fulfillment status, and review payments.": "តាមដានការបញ្ជាទិញរបស់អតិថិជន ធ្វើបច្ចុប្បន្នភាពស្ថានភាពដឹកជញ្ជូន និងពិនិត្យការទូទាត់។",
  "orders": "ការបញ្ជាទិញ",
  "Loading orders...": "កំពុងផ្ទុកការបញ្ជាទិញ...",
  "Guest": "ភ្ញៀវ",
  "Loading order details...": "កំពុងផ្ទុកព័ត៌មានការបញ្ជាទិញ...",
  "Grand total": "សរុបរួម",
  "Shipping address": "អាសយដ្ឋានដឹកជញ្ជូន",
  "Billing address": "អាសយដ្ឋានវិក្កយបត្រ",
  "Order items": "មុខទំនិញក្នុងការបញ្ជាទិញ",
  "Qty": "ចំនួន",
  "Unit": "ឯកតា",
  "No items on this order.": "មិនមានមុខទំនិញក្នុងការបញ្ជាទិញនេះទេ។",
  "Subtotal": "សរុបរង",
  "Discount": "បញ្ចុះតម្លៃ",
  "Shipping": "ការដឹកជញ្ជូន",
  "Tax": "ពន្ធ",
  "Payments": "ការទូទាត់",
  "No transaction id": "គ្មានលេខសម្គាល់ប្រតិបត្តិការ",
  "Update order": "ធ្វើបច្ចុប្បន្នភាពការបញ្ជាទិញ",
  "Fulfillment status": "ស្ថានភាពបំពេញការបញ្ជាទិញ",
  "Payment status": "ស្ថានភាពការទូទាត់",
  "Notes": "កំណត់ចំណាំ",
  "Internal fulfillment notes...": "កំណត់ចំណាំផ្ទៃក្នុងសម្រាប់ការបំពេញការបញ្ជាទិញ...",
  "This soft-deletes the product from the catalog.": "វានឹងដកផលិតផលចេញពីកាតាឡុកដោយមិនលុបជាអចិន្ត្រៃយ៍។",
  "Manage the Afiya Shope catalog, inventory levels, pricing, and visibility.": "គ្រប់គ្រងកាតាឡុក Afiya Shope កម្រិតស្តុក តម្លៃ និងការបង្ហាញផលិតផល។",
  "products": "ផលិតផល",
  "Loading products...": "កំពុងផ្ទុកផលិតផល...",
  "Yes": "មាន",
  "No": "គ្មាន",
  "Edit product": "កែសម្រួលផលិតផល",
  "Fill in catalog details, pricing, and stock.": "បំពេញព័ត៌មានផលិតផល តម្លៃ និងស្តុក។",
  "Product preview": "មើលជាមុនផលិតផល",
  "Product image (Cloudinary)": "រូបភាពផលិតផល (Cloudinary)",
  "JPG, PNG, or WebP. Uploads to your Cloudinary cloud": "JPG, PNG ឬ WebP។ បង្ហោះទៅ Cloudinary របស់អ្នក",
  "Clear selected file": "សម្អាតឯកសារដែលបានជ្រើសរើស",
  "Auto-generated if empty": "បង្កើតដោយស្វ័យប្រវត្តិ ប្រសិនបើទុកទទេ",
  "Create product": "បង្កើតផលិតផល",
  "avg order": "មធ្យមក្នុងមួយការបញ្ជាទិញ",
  "Product reports": "របាយការណ៍ផលិតផល",
  "Sales, margin, and stock for the catalog": "ការលក់ ប្រាក់ចំណេញ និងស្តុកផលិតផល",
  "All time": "គ្រប់ពេល",
  "Export CSV": "នាំចេញ CSV",
  "updating...": "កំពុងធ្វើបច្ចុប្បន្នភាព...",
  "Sales trend": "និន្នាការការលក់",
  "Product revenue in the selected period": "ចំណូលផលិតផលក្នុងរយៈពេលដែលបានជ្រើសរើស",
  "units": "ឯកតា",
  "Loading sales trend...": "កំពុងផ្ទុកនិន្នាការការលក់...",
  "No product sales in this period.": "មិនមានការលក់ផលិតផលក្នុងរយៈពេលនេះទេ។",
  "Loading product report...": "កំពុងផ្ទុករបាយការណ៍ផលិតផល...",
  "No products match these filters.": "មិនមានផលិតផលដែលត្រូវនឹងតម្រងទាំងនេះទេ។",
  "Loading...": "កំពុងផ្ទុក...",
  "Only Super Admin can manage store settings.": "មានតែអ្នកគ្រប់គ្រងជាន់ខ្ពស់ប៉ុណ្ណោះដែលអាចគ្រប់គ្រងការកំណត់ហាងបាន។",
  "Configure store profile, checkout, notifications, and system options.": "កំណត់ព័ត៌មានហាង ការទូទាត់ ការជូនដំណឹង និងជម្រើសប្រព័ន្ធ។",
  "Sections": "ផ្នែក",
  "Loading settings...": "កំពុងផ្ទុកការកំណត់...",
  "Update values below, then click Save changes.": "ធ្វើបច្ចុប្បន្នភាពតម្លៃខាងក្រោម រួចចុចរក្សាទុកការផ្លាស់ប្តូរ។",
  "Key": "សោ",
  "Enabled": "បានបើក",
  "optional": "ជាជម្រើស",
  "Uploading...": "កំពុងបង្ហោះ...",
  "Choose a file": "ជ្រើសរើសឯកសារ",
  "YouTube/Facebook links will not work as background. Use a direct file link.": "តំណ YouTube/Facebook មិនអាចប្រើជាផ្ទៃខាងក្រោយបានទេ។ សូមប្រើតំណឯកសារផ្ទាល់។",
  "preview": "មើលជាមុន",
  "Unsupported": "មិនគាំទ្រ",
  "No media selected (optional).": "មិនទាន់បានជ្រើសរើសមេឌៀ (ជាជម្រើស)។",
  "Select or link media before saving.": "ជ្រើសរើស ឬភ្ជាប់មេឌៀមុនពេលរក្សាទុក។",
  "Images": "រូបភាព",
  "max": "អតិបរមា",
  "Videos": "វីដេអូ",
  "Delete this banner? Its uploaded media will be kept.": "លុបបដានេះមែនទេ? មេឌៀដែលបានបង្ហោះនឹងត្រូវរក្សាទុក។",
  "Site settings sections": "ផ្នែកការកំណត់គេហទំព័រ",
  "Brand colors are saved for later use; they will only affect storefront areas that already support theming.": "ពណ៌ម៉ាកត្រូវបានរក្សាទុកសម្រាប់ប្រើពេលក្រោយ ហើយមានឥទ្ធិពលតែលើផ្នែកហាងដែលគាំទ្ររូបរាងប៉ុណ្ណោះ។",
  "Add link": "បន្ថែមតំណ",
  "Move quick link": "ផ្លាស់ទីតំណរហ័ស",
  "up": "ឡើងលើ",
  "down": "ចុះក្រោម",
  "Remove quick link": "លុបតំណរហ័ស",
  "The storefront uses its bundled local payment icons.": "ហាងប្រើរូបតំណាងការទូទាត់ដែលមានស្រាប់ក្នុងប្រព័ន្ធ។",
  "No banners have been created.": "មិនទាន់មានបដាត្រូវបានបង្កើតទេ។",
  "Banner order": "លំដាប់បដា",
  "Move banner": "ផ្លាស់ទីបដា",
  "Delete banner": "លុបបដា",
  "Text": "អត្ថបទ",
  "Add a headline in Khmer or English; one language is enough.": "បន្ថែមចំណងជើងជាភាសាខ្មែរ ឬអង់គ្លេស។ ជ្រើសរើសតែមួយភាសាក៏បាន។",
  "Banner text alignment": "ការតម្រឹមអត្ថបទបដា",
  "left": "ឆ្វេង",
  "center": "កណ្តាល",
  "right": "ស្តាំ",
  "More text options": "ជម្រើសអត្ថបទបន្ថែម",
  "Advanced options": "ជម្រើសកម្រិតខ្ពស់",
  "Please fix these banner fields": "សូមកែតម្រូវវាលបដាទាំងនេះ",
  "banner": "បដា",
  "Choose": "ជ្រើសរើស",
  "SVG allowed": "អនុញ្ញាត SVG",
  "This removes the staff account from the admin portal.": "វានឹងដកគណនីបុគ្គលិកចេញពីប្រព័ន្ធគ្រប់គ្រង។",
  "Create staff accounts, assign Super Admin, Admin, or Staff roles, and review what each role can access.": "បង្កើតគណនីបុគ្គលិក កំណត់តួនាទីអ្នកគ្រប់គ្រងជាន់ខ្ពស់ អ្នកគ្រប់គ្រង ឬបុគ្គលិក និងពិនិត្យសិទ្ធិរបស់តួនាទីនីមួយៗ។",
  "users": "អ្នកប្រើប្រាស់",
  "Loading users...": "កំពុងផ្ទុកអ្នកប្រើប្រាស់...",
  "You": "អ្នក",
  "Role permission coverage": "សិទ្ធិចូលប្រើតាមតួនាទី",
  "Super Admin has every permission. Admin and Staff keep the access listed below.": "អ្នកគ្រប់គ្រងជាន់ខ្ពស់មានសិទ្ធិទាំងអស់។ អ្នកគ្រប់គ្រង និងបុគ្គលិកមានសិទ្ធិដូចដែលបានរាយខាងក្រោម។",
  "permissions": "សិទ្ធិ",
  "Edit user": "កែសម្រួលអ្នកប្រើប្រាស់",
  "Set the account details and staff role.": "កំណត់ព័ត៌មានគណនី និងតួនាទីបុគ្គលិក។",
  "Leave blank to keep current": "ទុកទទេដើម្បីរក្សាពាក្យសម្ងាត់បច្ចុប្បន្ន",
  "Create user": "បង្កើតអ្នកប្រើប្រាស់",
  "pending": "កំពុងរង់ចាំ",
  "confirmed": "បានបញ្ជាក់",
  "processing": "កំពុងដំណើរការ",
  "shipped": "បានដឹកចេញ",
  "delivered": "បានដឹកជញ្ជូន",
  "cancelled": "បានបោះបង់",
  "failed": "បរាជ័យ",
  "paid": "បានបង់ប្រាក់",
  "refunded": "បានសងប្រាក់",
  "partially_refunded": "បានសងប្រាក់មួយផ្នែក",
  "Customer updated.": "បានធ្វើបច្ចុប្បន្នភាពអតិថិជន។",
  "Customer activated.": "បានបើកដំណើរការគណនីអតិថិជន។",
  "Customer deactivated.": "បានបិទដំណើរការគណនីអតិថិជន។",
  "Order updated.": "បានធ្វើបច្ចុប្បន្នភាពការបញ្ជាទិញ។",
  "Product updated.": "បានធ្វើបច្ចុប្បន្នភាពផលិតផល។",
  "Product created.": "បានបង្កើតផលិតផល។",
  "Product deleted.": "បានលុបផលិតផល។",
  "Product published.": "បានផ្សព្វផ្សាយផលិតផល។",
  "Product unpublished.": "បានដកការផ្សព្វផ្សាយផលិតផល។",
  "User updated.": "បានធ្វើបច្ចុប្បន្នភាពអ្នកប្រើប្រាស់។",
  "User created.": "បានបង្កើតអ្នកប្រើប្រាស់។",
  "User deleted.": "បានលុបអ្នកប្រើប្រាស់។",
  "User activated.": "បានបើកដំណើរការអ្នកប្រើប្រាស់។",
  "User deactivated.": "បានបិទដំណើរការអ្នកប្រើប្រាស់។",
  "Banner deleted. Uploaded media was kept.": "បានលុបបដា។ មេឌៀដែលបានបង្ហោះត្រូវបានរក្សាទុក។",
  "Media uploaded. Save this tab to apply it to the storefront.": "បានបង្ហោះមេឌៀ។ សូមរក្សាទុកផ្នែកនេះដើម្បីអនុវត្តវាទៅហាង។",
  "Unable to load products.": "មិនអាចផ្ទុកផលិតផលបានទេ។",
  "Unable to save product.": "មិនអាចរក្សាទុកផលិតផលបានទេ។",
  "Product saved, but image upload failed.": "បានរក្សាទុកផលិតផល ប៉ុន្តែការបង្ហោះរូបភាពបានបរាជ័យ។",
  "Unable to delete product.": "មិនអាចលុបផលិតផលបានទេ។",
  "Unable to update product status.": "មិនអាចធ្វើបច្ចុប្បន្នភាពស្ថានភាពផលិតផលបានទេ។",
  "Unable to load customers.": "មិនអាចផ្ទុកអតិថិជនបានទេ។",
  "Unable to load customer details.": "មិនអាចផ្ទុកព័ត៌មានអតិថិជនបានទេ។",
  "Unable to update customer.": "មិនអាចធ្វើបច្ចុប្បន្នភាពអតិថិជនបានទេ។",
  "Unable to update customer status.": "មិនអាចធ្វើបច្ចុប្បន្នភាពស្ថានភាពអតិថិជនបានទេ។",
  "Unable to load orders.": "មិនអាចផ្ទុកការបញ្ជាទិញបានទេ។",
  "Unable to load order details.": "មិនអាចផ្ទុកព័ត៌មានការបញ្ជាទិញបានទេ។",
  "Unable to update order.": "មិនអាចធ្វើបច្ចុប្បន្នភាពការបញ្ជាទិញបានទេ។",
  "Unable to load users.": "មិនអាចផ្ទុកអ្នកប្រើប្រាស់បានទេ។",
  "Unable to save user.": "មិនអាចរក្សាទុកអ្នកប្រើប្រាស់បានទេ។",
  "Unable to delete user.": "មិនអាចលុបអ្នកប្រើប្រាស់បានទេ។",
  "Unable to update user status.": "មិនអាចធ្វើបច្ចុប្បន្នភាពស្ថានភាពអ្នកប្រើប្រាស់បានទេ។",
  "Unable to load settings.": "មិនអាចផ្ទុកការកំណត់បានទេ។",
  "Unable to save settings.": "មិនអាចរក្សាទុកការកំណត់បានទេ។",
  "Settings saved successfully.": "បានរក្សាទុកការកំណត់ដោយជោគជ័យ។",
  "Unable to load product reports.": "មិនអាចផ្ទុករបាយការណ៍ផលិតផលបានទេ។",
  "Unable to export the product report.": "មិនអាចនាំចេញរបាយការណ៍ផលិតផលបានទេ។",
  "Product revenue": "ចំណូលផលិតផល",
  "In selected period": "ក្នុងរយៈពេលដែលបានជ្រើសរើស",
  "Units sold": "ចំនួនឯកតាដែលបានលក់",
  "Paid and open orders": "ការបញ្ជាទិញដែលបានបង់ និងកំពុងដំណើរការ",
  "Gross margin": "ប្រាក់ចំណេញដុល",
  "Set cost prices to calculate": "កំណត់ថ្លៃដើមដើម្បីគណនា",
  "Revenue minus unit cost": "ចំណូលដកថ្លៃដើមក្នុងមួយឯកតា",
  "Active products": "ផលិតផលសកម្ម",
  "matching filters": "ត្រូវនឹងតម្រង",
  "Catalog": "កាតាឡុក",
  "1–5 units left": "នៅសល់ 1–5 ឯកតា",
  "Tracked inventory at zero": "ស្តុកដែលកំពុងតាមដានមានចំនួនសូន្យ",
  "Custom range": "ចន្លោះពេលកំណត់",
  "Last 7 days": "7 ថ្ងៃចុងក្រោយ",
  "Last 30 days": "30 ថ្ងៃចុងក្រោយ",
  "Last 90 days": "90 ថ្ងៃចុងក្រោយ",
  "Last 12 months": "12 ខែចុងក្រោយ",
  "Manage categories in English and Khmer.": "គ្រប់គ្រងឈ្មោះប្រភេទជាភាសាអង់គ្លេស និងខ្មែរ។",
  "Add category": "បន្ថែមប្រភេទ",
  "English name": "ឈ្មោះជាភាសាអង់គ្លេស",
  "Khmer name": "ឈ្មោះជាភាសាខ្មែរ",
  "No categories found.": "រកមិនឃើញប្រភេទទេ។",
  "Edit category": "កែប្រែប្រភេទ",
  "Create category": "បង្កើតប្រភេទ",
  "Category names are required.": "ត្រូវបញ្ចូលឈ្មោះប្រភេទជាភាសាអង់គ្លេស និងខ្មែរ។",
  "Unable to load categories.": "មិនអាចផ្ទុកប្រភេទបានទេ។",
  "Unable to save category.": "មិនអាចរក្សាទុកប្រភេទបានទេ។",
  "Unable to delete category.": "មិនអាចលុបប្រភេទបានទេ។",
  "Cannot delete a category that still has products.": "មិនអាចលុបប្រភេទដែលនៅមានផលិតផលបានទេ។",
  "Category created.": "បានបង្កើតប្រភេទ។",
  "Category updated.": "បានធ្វើបច្ចុប្បន្នភាពប្រភេទ។",
  "Category deleted.": "បានលុបប្រភេទ។",
  "Delete this category?": "តើអ្នកចង់លុបប្រភេទនេះមែនទេ?",
  "Save category": "រក្សាទុកប្រភេទ",
  "No categories to show.": "មិនមានប្រភេទសម្រាប់បង្ហាញទេ។",
  "No brands to show.": "មិនមានម៉ាកសម្រាប់បង្ហាញទេ។",
  "No description.": "គ្មានការពិពណ៌នា។",
  "View Products": "មើលផលិតផល",
  "Create Products": "បង្កើតផលិតផល",
  "Update Products": "ធ្វើបច្ចុប្បន្នភាពផលិតផល",
  "Delete Products": "លុបផលិតផល",
  "View Orders": "មើលការបញ្ជាទិញ",
  "Update Orders": "ធ្វើបច្ចុប្បន្នភាពការបញ្ជាទិញ",
  "View Customers": "មើលអតិថិជន",
  "Update Customers": "ធ្វើបច្ចុប្បន្នភាពអតិថិជន",
  "View Reports": "មើលរបាយការណ៍",
  "Manage Settings": "គ្រប់គ្រងការកំណត់",
  "View Users": "មើលអ្នកប្រើប្រាស់",
  "Create Users": "បង្កើតអ្នកប្រើប្រាស់",
  "Update Users": "ធ្វើបច្ចុប្បន្នភាពអ្នកប្រើប្រាស់",
  "Delete Users": "លុបអ្នកប្រើប្រាស់",
  "Full access to all Afiya Shope admin features": "សិទ្ធិពេញលេញលើមុខងារគ្រប់គ្រងទាំងអស់របស់ Afiya Shope",
  "Manage catalog, orders, and customers": "គ្រប់គ្រងកាតាឡុក ការបញ្ជាទិញ និងអតិថិជន",
  "Limited operational access": "សិទ្ធិប្រតិបត្តិការមានកម្រិត",
  "Storefront shopper with account access": "អតិថិជនហាងដែលមានសិទ្ធិប្រើប្រាស់គណនី",
  "General": "ទូទៅ",
  "general": "ទូទៅ",
  "checkout": "ការទូទាត់",
  "notifications": "ការជូនដំណឹង",
  "system": "ប្រព័ន្ធ",
  "reports": "របាយការណ៍",
  "settings": "ការកំណត់",
  "Checkout & shipping": "ការទូទាត់ និងការដឹកជញ្ជូន",
  "Store name": "ឈ្មោះហាង",
  "Public name shown across Afiya Shope.": "ឈ្មោះសាធារណៈដែលបង្ហាញនៅទូទាំង Afiya Shope។",
  "Store tagline": "ពាក្យស្លោកហាង",
  "Short supporting line for branding.": "ឃ្លាខ្លីសម្រាប់គាំទ្រម៉ាកយីហោ។",
  "Support email": "អ៊ីមែលជំនួយ",
  "Customer support contact email.": "អ៊ីមែលទំនាក់ទំនងជំនួយអតិថិជន។",
  "Support phone": "ទូរស័ព្ទជំនួយ",
  "Customer support phone number.": "លេខទូរស័ព្ទជំនួយអតិថិជន។",
  "Currency": "រូបិយប័ណ្ណ",
  "Default store currency code.": "កូដរូបិយប័ណ្ណលំនាំដើមរបស់ហាង។",
  "Timezone": "តំបន់ពេលវេលា",
  "Store operational timezone.": "តំបន់ពេលវេលាប្រតិបត្តិការរបស់ហាង។",
  "Flat shipping rate": "ថ្លៃដឹកជញ្ជូនថេរ",
  "Default shipping fee charged at checkout.": "ថ្លៃដឹកជញ្ជូនលំនាំដើមដែលគិតនៅពេលទូទាត់។",
  "Free shipping threshold": "កម្រិតទឹកប្រាក់សម្រាប់ដឹកជញ្ជូនឥតគិតថ្លៃ",
  "Order total required for free shipping.": "ចំនួនសរុបនៃការបញ្ជាទិញដែលត្រូវការសម្រាប់ដឹកជញ្ជូនឥតគិតថ្លៃ។",
  "Tax rate (%)": "អត្រាពន្ធ (%)",
  "Default sales tax percentage.": "ភាគរយពន្ធលើការលក់លំនាំដើម។",
  "Allow guest checkout": "អនុញ្ញាតឱ្យទូទាត់ដោយមិនចាំបាច់មានគណនី",
  "Let customers checkout without an account.": "អនុញ្ញាតឱ្យអតិថិជនទូទាត់ដោយមិនចាំបាច់មានគណនី។",
  "Order emails": "អ៊ីមែលការបញ្ជាទិញ",
  "Send email notifications for new orders.": "ផ្ញើការជូនដំណឹងតាមអ៊ីមែលសម្រាប់ការបញ្ជាទិញថ្មី។",
  "Low stock emails": "អ៊ីមែលស្តុកជិតអស់",
  "Notify admins when stock is low.": "ជូនដំណឹងដល់អ្នកគ្រប់គ្រងនៅពេលស្តុកមានចំនួនតិច។",
  "Low stock threshold": "កម្រិតស្តុកទាប",
  "Inventory quantity that triggers low-stock alerts.": "ចំនួនស្តុកដែលបង្កឱ្យមានការជូនដំណឹងអំពីស្តុកទាប។",
  "Maintenance mode": "របៀបថែទាំ",
  "Temporarily disable storefront shopping.": "បិទការទិញទំនិញនៅហាងជាបណ្តោះអាសន្ន។",
  "Allow customer registration": "អនុញ្ញាតការចុះឈ្មោះអតិថិជន",
  "Enable new customer sign-ups on the storefront.": "អនុញ្ញាតឱ្យអតិថិជនថ្មីចុះឈ្មោះនៅលើហាង។",
  "Admin home": "ទំព័រដើមប្រព័ន្ធគ្រប់គ្រង",
  "No image available": "មិនមានរូបភាពទេ",
  "Add product": "បន្ថែមផលិតផល",
  "Add user": "បន្ថែមអ្នកប្រើប្រាស់",
  "Choose media": "ជ្រើសរើសមេឌៀ",
  "Image": "រូបភាព",
  "JPG / PNG / WebP · max 5 MB": "JPG / PNG / WebP · អតិបរមា 5 MB",
  "MP4 / WebM · max 15 MB": "MP4 / WebM · អតិបរមា 15 MB",
  "No media selected": "មិនទាន់បានជ្រើសរើសមេឌៀ",
  "Overlay darkness": "កម្រិតភាពងងឹតលើរូបភាព",
  "Remove": "យកចេញ",
  "Replace media": "ជំនួសមេឌៀ",
  "Text alignment": "ការតម្រឹមអត្ថបទ",
  "Video": "វីដេអូ",
  "input method": "វិធីបញ្ចូល",
  "Manage the contact details and social profiles shown to customers.": "គ្រប់គ្រងព័ត៌មានទំនាក់ទំនង និងគណនីបណ្តាញសង្គមដែលបង្ហាញដល់អតិថិជន។",
  "WhatsApp link": "តំណ WhatsApp",
  "Google Maps link": "តំណ Google Maps",
  "Facebook page URL": "URL ទំព័រ Facebook",
  "Instagram URL": "URL Instagram",
  "TikTok URL": "URL TikTok",
  "Telegram channel URL": "URL ឆានែល Telegram",
  "Address (Khmer)": "អាសយដ្ឋាន (ខ្មែរ)",
  "Address (English)": "អាសយដ្ឋាន (អង់គ្លេស)",
  "Business hours (Khmer)": "ម៉ោងបើកដំណើរការ (ខ្មែរ)",
  "Business hours (English)": "ម៉ោងបើកដំណើរការ (អង់គ្លេស)",
  "Edit the about text, link groups, payment options, and copyright.": "កែសម្រួលអត្ថបទអំពីហាង ក្រុមតំណ ជម្រើសបង់ប្រាក់ និងកម្មសិទ្ធិបញ្ញា។",
  "Label (Khmer)": "ស្លាក (ខ្មែរ)",
  "Label (English)": "ស្លាក (អង់គ្លេស)",
  "Cash on delivery": "បង់ប្រាក់ពេលទទួលទំនិញ",
  "Copyright (Khmer)": "កម្មសិទ្ធិបញ្ញា (ខ្មែរ)",
  "Copyright (English)": "កម្មសិទ្ធិបញ្ញា (អង់គ្លេស)",
  "Set page metadata and social sharing defaults.": "កំណត់ទិន្នន័យមេតាទំព័រ និងការចែករំលែកបណ្តាញសង្គមលំនាំដើម។",
  "Site title (Khmer)": "ចំណងជើងគេហទំព័រ (ខ្មែរ)",
  "Site title (English)": "ចំណងជើងគេហទំព័រ (អង់គ្លេស)",
  "Meta description (Khmer)": "ការពិពណ៌នា Meta (ខ្មែរ)",
  "Meta description (English)": "ការពិពណ៌នា Meta (អង់គ្លេស)",
  "Default share image (Open Graph)": "រូបភាពចែករំលែកលំនាំដើម (Open Graph)",
  "Keywords (comma-separated)": "ពាក្យគន្លឹះ (បំបែកដោយក្បៀស)",
  "Optional; up to 30 keywords.": "ជាជម្រើស អាចបញ្ចូលពាក្យគន្លឹះរហូតដល់ 30។",
  "Google Analytics ID": "លេខសម្គាល់ Google Analytics",
  "Optional GA4 format, for example G-ABC1234567.": "ទម្រង់ GA4 ជាជម្រើស ឧទាហរណ៍ G-ABC1234567។",
  "Button URL (HTTPS or /relative-path)": "URL ប៊ូតុង (HTTPS ឬ /relative-path)",
  "Khmer eyebrow": "អត្ថបទខ្លីខាងលើ (ខ្មែរ)",
  "English eyebrow": "អត្ថបទខ្លីខាងលើ (អង់គ្លេស)",
  "Khmer headline": "ចំណងជើង (ខ្មែរ)",
  "English headline": "ចំណងជើង (អង់គ្លេស)",
  "Khmer subtitle": "ចំណងជើងរង (ខ្មែរ)",
  "English subtitle": "ចំណងជើងរង (អង់គ្លេស)",
  "Khmer button text": "អត្ថបទប៊ូតុង (ខ្មែរ)",
  "English button text": "អត្ថបទប៊ូតុង (អង់គ្លេស)",
  "Media": "មេឌៀ",
  "Mobile media": "មេឌៀសម្រាប់ទូរស័ព្ទ",
  "Poster image": "រូបភាពផ្ទាំងបង្ហាញ",
  "Button URL": "URL ប៊ូតុង",
  "Starts at": "ចាប់ផ្តើមនៅ",
  "Ends at": "បញ្ចប់នៅ",
  "Poster / fallback image": "រូបភាពផ្ទាំងបង្ហាញ / រូបភាពជំនួស",
  "Upload file": "បង្ហោះឯកសារ",
  "Paste link": "បិទភ្ជាប់តំណ",
  "Choose a JPG, JPEG, PNG, or WebP image.": "ជ្រើសរើសរូបភាព JPG, JPEG, PNG ឬ WebP។",
  "Video files must be 15 MB or smaller.": "ឯកសារវីដេអូត្រូវមានទំហំមិនលើស 15 MB។",
  "Image files must be 5 MB or smaller.": "ឯកសាររូបភាពត្រូវមានទំហំមិនលើស 5 MB។",
  "Use a direct HTTPS link.": "សូមប្រើតំណ HTTPS ផ្ទាល់។",
  "Links with embedded credentials are not allowed.": "មិនអនុញ្ញាតឱ្យប្រើតំណដែលបញ្ចូលព័ត៌មានសម្ងាត់ទេ។",
  "Use a JPG, JPEG, PNG, WebP, MP4, or WebM file link.": "សូមប្រើតំណឯកសារ JPG, JPEG, PNG, WebP, MP4 ឬ WebM។",
  "Enter a valid HTTPS link.": "សូមបញ្ចូលតំណ HTTPS ត្រឹមត្រូវ។",
  "Choose a JPG, PNG, WebP, or SVG logo.": "ជ្រើសរើសឡូហ្គោ JPG, PNG, WebP ឬ SVG។",
  "Choose an MP4 or WebM video.": "ជ្រើសរើសវីដេអូ MP4 ឬ WebM។",
  "Choose a JPG, PNG, or WebP image.": "ជ្រើសរើសរូបភាព JPG, PNG ឬ WebP។",
  "Add a media file or direct HTTPS link before saving.": "បន្ថែមឯកសារមេឌៀ ឬតំណ HTTPS ផ្ទាល់មុនពេលរក្សាទុក។",
  "Temporary browser media URLs cannot be saved. Upload the file or use a direct HTTPS link.": "មិនអាចរក្សាទុក URL មេឌៀបណ្តោះអាសន្នពីកម្មវិធីរុករកបានទេ។ សូមបង្ហោះឯកសារ ឬប្រើតំណ HTTPS ផ្ទាល់។",
  "Use a direct HTTPS media link.": "សូមប្រើតំណមេឌៀ HTTPS ផ្ទាល់។",
  "Temporary browser URLs cannot be used as a button link.": "មិនអាចប្រើ URL បណ្តោះអាសន្នពីកម្មវិធីរុករកជាតំណប៊ូតុងបានទេ។",
  "Choose a JPG, JPEG, PNG, WebP, MP4, or WebM file.": "ជ្រើសរើសឯកសារ JPG, JPEG, PNG, WebP, MP4 ឬ WebM។",
};

function getLanguageSnapshot(): AdminLanguage {
  return window.localStorage.getItem(LANGUAGE_STORAGE_KEY) === "km" ? "km" : "en";
}

function getServerLanguageSnapshot(): AdminLanguage {
  return "en";
}

function subscribeToLanguage(onChange: () => void) {
  window.addEventListener(LANGUAGE_CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(LANGUAGE_CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function useAdminLanguage() {
  return useSyncExternalStore(
    subscribeToLanguage,
    getLanguageSnapshot,
    getServerLanguageSnapshot
  );
}

export function useAdminText() {
  const language = useAdminLanguage();
  return useCallback(
    (english: string, khmer = ADMIN_KHMER_TRANSLATIONS[english] ?? english) =>
      language === "km" ? khmer : english,
    [language]
  );
}

export function AdminLanguageSelector() {
  const language = useAdminLanguage();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function selectLanguage(nextLanguage: AdminLanguage) {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
    window.dispatchEvent(new Event(LANGUAGE_CHANGE_EVENT));
    setOpen(false);
  }

  const isKhmer = language === "km";
  const options = [
    {
      language: "en" as const,
      flagSrc: "/flags/gb.svg",
      label: isKhmer ? "អង់គ្លេស" : "English",
    },
    {
      language: "km" as const,
      flagSrc: "/flags/kh.svg",
      label: isKhmer ? "ខ្មែរ" : "Khmer",
    },
  ];

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="inline-flex items-center gap-1.5 rounded-xl border border-[#d6e8f2] bg-white px-2.5 py-2.5 text-slate-600 transition hover:bg-slate-50"
        aria-label={isKhmer ? "ភាសា៖ ខ្មែរ" : "Language: English"}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls="admin-language-menu"
        title={isKhmer ? "ភាសា" : "Language"}
      >
        <Image
          src={isKhmer ? "/flags/kh.svg" : "/flags/gb.svg"}
          alt=""
          aria-hidden="true"
          width={24}
          height={18}
          className="h-4 w-6 rounded-sm object-cover"
        />
      </button>

      {open ? (
        <div
          id="admin-language-menu"
          role="listbox"
          aria-label={isKhmer ? "ការជ្រើសរើសភាសា" : "Language selection"}
          className="absolute right-0 top-full z-[70] mt-3 w-56 overflow-hidden rounded-2xl border border-[#d6e8f2] bg-white p-2 shadow-2xl"
        >
          <p
            lang={language}
            className="border-b border-[#e2edf4] px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400"
          >
            {isKhmer ? "ភាសា" : "Language"}
          </p>
          {options.map((option) => {
            const selected = language === option.language;
            return (
              <button
                key={option.language}
                type="button"
                role="option"
                aria-selected={selected}
                lang={option.language}
                onClick={() => selectLanguage(option.language)}
                className={`mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                  selected
                    ? "bg-[#eaf6fc] text-[#0b1b3a]"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Image
                  src={option.flagSrc}
                  alt=""
                  aria-hidden="true"
                  width={24}
                  height={18}
                  className="h-4 w-6 rounded-sm object-cover"
                />
                <span className="flex-1 font-medium">{option.label}</span>
                {selected ? (
                  <Check className="h-4 w-4 shrink-0 text-[#0077b6]" aria-hidden="true" />
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
