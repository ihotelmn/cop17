# AWS S3 Read-Only Хэрэглэгч Үүсгэх Заавар

Энэхүү заавар нь таны үндсэн системд нөлөөлөхгүйгээр, зөвхөн S3 дээрх файлуудыг унших эрхтэй, аюулгүй хэрэглэгч үүсгэхэд тусална. https://aws.amazon.com/console/ руу нэвтрээд дараах алхмуудыг хийнэ үү.

## Алхам 1: Policy (Эрх) Үүсгэх

1.  **AWS Console** руу нэвтэрч орох.
2.  Хайлтын хэсэгт **IAM** гэж бичээд сонгох.
3.  Зүүн цэснээс **Policies** хэсгийг сонгоно.
4.  **Create policy** товчийг дарна.
5.  **JSON** таб-ыг сонгоно.
6.  Байгаа кодыг арилгаад доорх кодыг хуулж тавина:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:GetObject",
                "s3:ListBucket"
            ],
            "Resource": [
                "arn:aws:s3:::ihotel.mn",
                "arn:aws:s3:::ihotel.mn/*"
            ]
        }
    ]
}
```

7.  **Next** товчийг дарна.
8.  **Policy name** хэсэгт `iHotel_S3_ReadOnly` гэж нэр өгнө.
9.  **Create policy** товчийг дарж дуусгана.

## Алхам 2: User (Хэрэглэгч) Үүсгэх

1.  Зүүн цэснээс **Users** хэсгийг сонгоно.
2.  **Create user** товчийг дарна.
3.  **User name** хэсэгт `cop17_migration_user` гэж нэр өгөөд **Next** дарна.
4.  **Attach policies directly** сонголтыг идэвхжүүлнэ.
5.  Доорх жагсаалтаас сая үүсгэсэн `iHotel_S3_ReadOnly` гэсэн Policy-гоо хайж олоод чагтална.
6.  **Next** болон **Create user** товчийг дарна.

## Алхам 3: Түлхүүр (Access Key) Үүсгэх

1.  Жагсаалтаас дөнгөж үүсгэсэн `cop17_migration_user` хэрэглэгч дээрээ дарж орно.
2.  **Security credentials** таб руу орно.
3.  Доош гүйлгээд **Access keys** хэсэгт **Create access key** товчийг дарна.
4.  **Application running outside AWS** гэдгийг сонгоод **Next** дарна.
5.  **Create access key** товчийг дарна.
6.  Гарч ирсэн **Access key** болон **Secret access key**-ийг хуулж аваад надад (эсвэл .env файлдаа) өгнө үү.

> [!WARNING]
> **Secret access key** нь зөвхөн энэ удаа л харагдах тул сайн хадгалж аваарай.
