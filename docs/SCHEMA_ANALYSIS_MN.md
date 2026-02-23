# COP17 Зочдод Зориулсан Өгөгдлийн Шинжилгээ

Таны хүсэлтийн дагуу бид зөвхөн **зочдод хэрэгтэй**, системийг баяжуулах өгөгдлүүд дээр төвлөрч, техникийн (Channel Manager гэх мэт) мэдээллийг хаслаа.

## 1. Зочид Буудлын Мэдээлэл (Hotel Enrichment)
Зочид буудлын хуудсыг илүү баялаг, ойлгомжтой болгохын тулд Odoo-с дараах өгөгдлийг татаж авна:

*   **`images` (Зурган мэдээлэл):** Зочид буудлын үндсэн зургууд. Odoo-д байгаа бүх өндөр чанартай зургуудыг `galleries` эсвэл `images` талбар руу оруулна.
*   **`description` (Дэлгэрэнгүй тайлбар):** Буудлын тухай дэлгэрэнгүй танилцуулга.
*   **`star_rating` (Зэрэглэл):** Зочид буудлын одны зэрэглэл (3, 4, 5 од).
*   **`check_in_time` / `check_out_time`:** Зочин хэзээ ирж, хэзээ гарах цагийн хуваарь.
*   **`address` & `district_id`:** Байршлын нарийвчилсан мэдээлэл.
*   **`amenities` (Хангамж/Үйлчилгээ):** WiFi, Parking, Breakfast зэрэг зочдод хамгийн чухал мэдээллийг дүрс (icon)-тэй нь харуулах.

## 2. Өрөөний Мэдээлэл (Room Experience)
Зочин өрөөгөө сонгоход туслах гол үзүүлэлтүүдийг нэмнэ:

*   **`size` (Өрөөний хэмжээ):** m2-аар харуулах. (Жишээ нь: 35m2)
*   **`bed_number` & `bed_type` (Орны мэдээлэл):** "1 King Bed" эсвэл "2 Single Beds" гэх мэт.
*   **`occupancy` (Хүний тоо):** Тухайн өрөөнд байрлах боломжтой хүний тоо (Tom/Huuhed).
*   **`facilities` (Өрөөний тоноглол):** Зурагт, Мини-бар, Агааржуулагч гэх мэт зүйлс.
*   **`photos` (Өрөөний зургууд):** Тухайн өрөөний дотоод зургууд.

## 3. Хийгдэх Өөрчлөлт (SQL Migration)

Бид COP17 баазыг бэлдэхийн тулд дараах багануудыг нэмэх шаардлагатай:

```sql
-- Hotels table enrichment
ALTER TABLE public.hotels 
ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE, -- SEO-д хэрэгтэй
ADD COLUMN IF NOT EXISTS star_rating INTEGER, -- Одоор шүүхэд
ADD COLUMN IF NOT EXISTS district_id INTEGER; -- Байршлаар шүүхэд

-- Rooms table enrichment
ALTER TABLE public.rooms 
ADD COLUMN IF NOT EXISTS size_sqm INTEGER, -- Өрөөний квадрат метр
ADD COLUMN IF NOT EXISTS bed_config TEXT, -- Орны мэдээлэл (Жнь: "1 King, 1 Sofa")
ADD COLUMN IF NOT EXISTS max_adults INTEGER DEFAULT 2, -- Том хүн
ADD COLUMN IF NOT EXISTS max_children INTEGER DEFAULT 0; -- Хүүхэд
```

**Дараагийн алхам:**
Би дээрх өөрчлөлтүүдийг хийх SQL файлыг бэлдсэн. Та зөвшөөрвөл би бааз дээрээ ажиллуулъя.
