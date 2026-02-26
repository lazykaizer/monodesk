from PIL import Image
import os

def remove_checkerboard(input_path):
    if not os.path.exists(input_path):
        print(f"Error: {input_path} not found")
        return

    img = Image.open(input_path).convert("RGBA")
    pixdata = img.load()

    # Get dimensions
    width, height = img.size

    # Sample the checkerboard colors from the corners
    # Usually (0,0) is one color, and (10,10) or similar is the other
    # We'll sample a few points to be sure
    bg_colors = set()
    bg_colors.add(pixdata[0, 0][:3])
    bg_colors.add(pixdata[width-1, 0][:3])
    bg_colors.add(pixdata[0, height-1][:3])
    bg_colors.add(pixdata[width-1, height-1][:3])
    
    # Also sample a bit inward to catch the other checkerboard color
    bg_colors.add(pixdata[8, 8][:3])
    bg_colors.add(pixdata[16, 16][:3])

    print(f"Detected background-like colors: {bg_colors}")

    for y in range(height):
        for x in range(width):
            if pixdata[x, y][:3] in bg_colors:
                pixdata[x, y] = (0, 0, 0, 0)

    img.save(input_path)
    print(f"Successfully processed {input_path}")

if __name__ == "__main__":
    logo_path = "public/images/logo.png"
    remove_checkerboard(logo_path)
