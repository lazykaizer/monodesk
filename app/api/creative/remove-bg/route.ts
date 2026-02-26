import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";
import { promisify } from "util";
import { writeFile } from "fs/promises";

const execPromise = promisify(exec);

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get("image") as File;

        if (!file) {
            return NextResponse.json({ error: "No image provided" }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const tempDir = os.tmpdir();
        const inputPath = path.join(tempDir, `input_${Date.now()}_${file.name}`);
        const outputPath = path.join(tempDir, `output_${Date.now()}.png`);

        await writeFile(inputPath, buffer);

        try {
            // Using "python" command assuming it's in PATH. 
            // In some environments it might be "python3".
            // You can adjust this based on the environment.
            const scriptPath = path.join(process.cwd(), "scripts", "remove_bg.py");

            // Check if python exists
            let pythonCommand = "python";
            try {
                await execPromise("python --version");
            } catch {
                try {
                    await execPromise("python3 --version");
                    pythonCommand = "python3";
                } catch {
                    return NextResponse.json({ error: "Python not found on server" }, { status: 500 });
                }
            }

            const { stdout, stderr } = await execPromise(`${pythonCommand} "${scriptPath}" "${inputPath}" "${outputPath}"`);

            if (stderr && !stdout) {
                console.error("Python Error:", stderr);
                throw new Error(stderr);
            }

            const outputBuffer = fs.readFileSync(outputPath);

            // Cleanup
            fs.unlinkSync(inputPath);
            fs.unlinkSync(outputPath);

            // Return the image
            return new NextResponse(outputBuffer, {
                headers: {
                    "Content-Type": "image/png",
                },
            });

        } catch (error: any) {
            console.error("Processing Error:", error);
            // Cleanup input if it exists
            if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
            return NextResponse.json({ error: "Failed to process image: " + error.message }, { status: 500 });
        }

    } catch (error: any) {
        console.error("API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
