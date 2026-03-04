from PIL import Image, ImageChops
import os

# Input path: The actual user-uploaded image
input_path = "/Users/erkardo/.gemini/antigravity/brain/16f60404-390e-490a-8f3a-ac3a4a6a3506/media__1772558152198.png"
# Output path
output_path = "/Users/erkardo/Desktop/COP17_Mongolia/cop17-platform/public/favicon.webp"

def process_branding():
    if not os.path.exists(input_path):
        print(f"Error: Input file not found at {input_path}")
        return

    img = Image.open(input_path).convert("RGBA")
    
    # 1. Make white/near-white transparent
    datas = img.getdata()
    newData = []
    for item in datas:
        if item[0] > 245 and item[1] > 245 and item[2] > 245:
            newData.append((255, 255, 255, 0))
        else:
            newData.append(item)
    img.putdata(newData)

    # 2. Trim excess empty space to make the logo look "larger"
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)
        
    # 3. Add a tiny bit of padding so it's not touching the edges (optional, but looks better)
    padding = int(max(img.size) * 0.05)
    new_size = (img.size[0] + padding * 2, img.size[1] + padding * 2)
    padded_img = Image.new("RGBA", new_size, (255, 255, 255, 0))
    padded_img.paste(img, (padding, padding))
    img = padded_img

    # 4. Save Favicon (WebP)
    img.save(output_path, "WEBP", lossless=True)
    
    # 5. Save Apple Touch Icon (180x180 PNG, No transparency usually preferred by iOS but let's keep it clean)
    apple_path = "/Users/erkardo/Desktop/COP17_Mongolia/cop17-platform/public/apple-touch-icon.png"
    apple_img = img.resize((180, 180), Image.Resampling.LANCZOS)
    apple_img.save(apple_path, "PNG")

    # 6. Save high-res PNG for other uses
    png_path = "/Users/erkardo/Desktop/COP17_Mongolia/cop17-platform/public/icon-512.png"
    png_img = img.resize((512, 512), Image.Resampling.LANCZOS)
    png_img.save(png_path, "PNG")

    print(f"Branding assets generated in public/")

process_branding()
