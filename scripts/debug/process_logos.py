from PIL import Image, ImageOps
import os

LOGOS_DIR = "public/images/partner logos"
FILES = [
    "gov-mongolia.webp",
    "ministry-environment.webp",
    "ministry-foreign.png",
    "ulaanbaatar-city.png"
]

TARGET_HEIGHT = 100

def make_transparent(img, threshold=200):
    img = img.convert("RGBA")
    datas = img.getdata()
    newData = []
    for item in datas:
        # If pixel is white-ish, make it transparent
        if item[0] > threshold and item[1] > threshold and item[2] > threshold:
            newData.append((255, 255, 255, 0))
        else:
            newData.append(item)
    img.putdata(newData)
    return img

def trim(im):
    bg = Image.new(im.mode, im.size, im.getpixel((0,0)))
    diff = ImageChops.difference(im, bg)
    diff = ImageChops.add(diff, diff, 2.0, -100)
    bbox = diff.getbbox()
    if bbox:
        return im.crop(bbox)
    return im

def trim_alpha(im):
    # Trim based on alpha channel
    im = im.convert("RGBA")
    bbox = im.getbbox()
    if bbox:
        return im.crop(bbox)
    return im

for filename in FILES:
    path = os.path.join(LOGOS_DIR, filename)
    
    # Check if we already processed it (e.g. .png exists for .webp)
    base_name = os.path.splitext(filename)[0]
    png_path = os.path.join(LOGOS_DIR, base_name + ".png")
    svg_path = os.path.join(LOGOS_DIR, base_name + ".svg")
    
    # Special handling for ministry-foreign (misnamed SVG) - REMOVED as user uploaded real PNG
    # if filename == "ministry-foreign.png":
    #    ... (removed)
    
    # If the processed PNG exists, skip processing but print dims
    # But if input is PNG, output is same name, so we must NOT skip if we want to process it in-place or if it's new.
    # For ministry-foreign.png, we want to re-process it.
    if os.path.exists(svg_path):
        print(f"File is SVG: {os.path.basename(svg_path)}")
        # We don't want to use SVG anymore for foreign ministry
        if filename == "ministry-foreign.png":
            pass # Continue to process the PNG
        else:
            continue

    if os.path.exists(png_path) and filename not in ["ulaanbaatar-city.png", "ministry-foreign.png"]: 
         with Image.open(png_path) as img:
             print(f"Processed {os.path.basename(png_path)}: {img.width}x{img.height}")
         continue

    if not os.path.exists(path):
        # Maybe it's already source file with .png extension (for ulaanbaatar)
        if os.path.exists(png_path):
            path = png_path # process the source png
        else:
             print(f"Skipping {filename}: Not found")
             continue

    print(f"Processing {filename}...")
    try:
        img = Image.open(path)
        img = trim_alpha(img)
        aspect_ratio = img.width / img.height
        new_width = int(TARGET_HEIGHT * aspect_ratio)
        img = img.resize((new_width, TARGET_HEIGHT), Image.Resampling.LANCZOS)
        
        save_path = os.path.join(LOGOS_DIR, base_name + ".png")
        img.save(save_path, "PNG")
        print(f"Saved {os.path.basename(save_path)}: {new_width}x{TARGET_HEIGHT}")
    except Exception as e:
        print(f"Failed to process {filename}: {e}")
