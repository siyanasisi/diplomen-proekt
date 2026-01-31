# Supabase: прикачане на снимки в чата

За да изпращате снимки/файлове в чата, трябва да направите следното в **Supabase Dashboard**.

---

## 1. База данни – нова колона в `messages`

В **SQL Editor** изпълнете:

```sql
-- Добавя колона за URL на прикачения файл (снимка/документ)
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS attachment_url text;
```

Така всяко съобщение може да има опционален `attachment_url` (линк към файл в Storage).

---

## 2. Storage – bucket за чат прикачвания

1. Отидете в **Storage** в лявото меню.
2. Натиснете **New bucket**.
3. Име на bucket: **`chat-attachments`**.
4. По желание: **Public bucket** = ON, ако искате снимките да се отварят директно по линк (по-лесно за чата). Ако го оставите OFF, ще трябва да ползвате signed URLs от кода.
5. Запазете bucket-а.

---

## 3. Storage – bucket чрез SQL (по избор)

Ако искате да създадете bucket-а чрез SQL вместо от Dashboard:

```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-attachments',
  'chat-attachments',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
)
ON CONFLICT (id) DO NOTHING;
```

- `public = true` – снимките са достъпни по публичен URL.
- `file_size_limit = 5242880` – макс. 5 MB на файл (по желание променете).
- `allowed_mime_types` – разрешени типове; при нужда добавете/премахнете.

---

## 4. Всички политики като SQL заявки

Копирайте и изпълнете в **SQL Editor** в Supabase. Първо създайте bucket **`chat-attachments`** от Dashboard (Storage → New bucket) или с заявката от секция 3.

### 4.1. Storage – INSERT (качване)

Само влезли потребители могат да качват файлове в папка с име = техния `auth.uid()`.

```sql
CREATE POLICY "Users can upload chat attachments"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'chat-attachments'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

### 4.2. Storage – SELECT (четене)

Влезли потребители могат да четат (виждат) файлове от bucket-а.

```sql
CREATE POLICY "Authenticated users can read chat attachments"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'chat-attachments');
```

### 4.3. Storage – DELETE (изтриване, по избор)

Ако искате потребителите да могат да изтриват само собствените си файлове (в папката с техния `user_id`):

```sql
CREATE POLICY "Users can delete own chat attachments"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'chat-attachments'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

### 4.4. Премахване на политики (ако ги променяте)

Преди да създадете отново политики с същите имена, първо ги изтрийте:

```sql
DROP POLICY IF EXISTS "Users can upload chat attachments" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can read chat attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own chat attachments" ON storage.objects;
```

---

## 5. Проверка

- В **Table Editor** → таблица **messages** трябва да има колона **attachment_url** (тип text, nullable).
- В **Storage** трябва да има bucket **chat-attachments** и политиките от секция 4.

След това приложението ще може да качва снимки в този bucket и да записва линка в `attachment_url` при изпращане на съобщение.
