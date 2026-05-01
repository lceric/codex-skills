#!/usr/bin/env python3
"""Generate an image using gpt-image-2 API with retry support."""

import os
import sys
import json
import re
import time
import base64
import requests
from pathlib import Path


def load_env():
    """Load environment variables from .claude/settings.local.json or .env file."""
    # First, try .claude/settings.local.json
    settings_path = Path.cwd() / ".claude" / "settings.local.json"
    if settings_path.exists():
        try:
            with open(settings_path) as f:
                data = json.load(f)
                if "env" in data:
                    for key, value in data["env"].items():
                        os.environ.setdefault(key, value)
        except (json.JSONDecodeError, KeyError):
            pass

    # Then, try .env file
    env_path = Path.cwd() / ".env"
    if env_path.exists():
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, value = line.split("=", 1)
                    os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


def sanitize_filename(prompt: str) -> str:
    """Convert prompt to a safe filename."""
    safe = re.sub(r'[^a-zA-Z0-9\s]', '', prompt[:50])
    safe = re.sub(r'\s+', '_', safe.strip())
    return safe.lower() or "generated_image"


def classify_error(response) -> str:
    """Classify API error into a human-readable category."""
    status = response.status_code
    try:
        body = response.json()
        msg = body.get("error", {}).get("message", response.text)
    except Exception:
        msg = response.text

    if status == 401:
        return f"Authentication failed (401): Check IMAGE_API_KEY. {msg}"
    if status == 403:
        return f"Access denied (403): {msg}"
    if status == 429:
        return f"Rate limited (429): Too many requests. Wait and retry. {msg}"
    if status == 400:
        return f"Bad request (400): The prompt may have been rejected by content filters, or parameters are invalid. {msg}"
    if status >= 500:
        return f"Server error ({status}): The API service is having issues. {msg}"
    return f"API error ({status}): {msg}"


def should_retry(status_code: int) -> bool:
    """Return True if the request should be retried."""
    return status_code in (429, 500, 502, 503, 504)


def generate_image(
    prompt: str,
    output_path: str = None,
    size: str = "1024x1024",
    quality: str = "standard",
    response_format: str = "b64_json",
    timeout: int = 180,
    max_retries: int = 3,
):
    """Generate an image using the gpt-image-2 API.

    Args:
        prompt: The image description
        output_path: Where to save the image (auto-generated from prompt if None)
        size: Image size - "1024x1024", "1536x1024", "1024x1536", or "1792x1024", "1024x1792"
        quality: "standard" (cheaper, faster) or "hd" (higher detail)
        response_format: "b64_json" (default, avoids extra download) or "url"
        timeout: Request timeout in seconds (default 180)
        max_retries: Number of retries on transient errors (default 3)

    Returns:
        Path to the saved image file
    """
    load_env()

    base_url = os.environ.get("IMAGE_BASE_URL", "").rstrip("/")
    api_key = os.environ.get("IMAGE_API_KEY")

    if not base_url or not api_key:
        missing = []
        if not base_url:
            missing.append("IMAGE_BASE_URL")
        if not api_key:
            missing.append("IMAGE_API_KEY")
        raise ValueError(f"Missing required environment variables: {', '.join(missing)}")

    url = f"{base_url}/images/generations"

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": "gpt-image-2",
        "prompt": prompt,
        "size": size,
        "n": 1,
        "quality": quality,
        "response_format": response_format,
    }

    print(f"Calling API: {url}")
    print(f"Parameters: size={size}, quality={quality}, response_format={response_format}")
    print(f"Prompt length: {len(prompt)} chars")

    last_error = None
    for attempt in range(1, max_retries + 2):  # initial + retries
        try:
            print(f"Attempt {attempt}/{max_retries + 1}...")
            start_time = time.time()

            response = requests.post(url, headers=headers, json=payload, timeout=timeout)
            elapsed = time.time() - start_time

            if response.status_code == 200:
                print(f"Request completed in {elapsed:.1f}s")

                data = response.json()
                # Don't print full base64 response - just metadata
                image_data = data.get("data", [{}])[0]
                if image_data.get("b64_json"):
                    print(f"Received base64 image data ({len(image_data['b64_json'])} chars)")
                elif image_data.get("url"):
                    print(f"Received image URL: {image_data['url'][:80]}...")

                # Determine output path
                if not output_path:
                    filename = sanitize_filename(prompt) + ".png"
                    output_path = str(Path.cwd() / filename)

                # Handle response - URL or base64
                image_url = image_data.get("url") or image_data.get("image_url")
                b64_data = image_data.get("b64_json") or image_data.get("image")

                if b64_data and response_format == "b64_json":
                    print(f"Decoding base64 image...")
                    img_bytes = base64.b64decode(b64_data)
                    with open(output_path, "wb") as f:
                        f.write(img_bytes)
                elif image_url:
                    print(f"Downloading image from URL...")
                    img_response = requests.get(image_url, timeout=60)
                    img_response.raise_for_status()
                    with open(output_path, "wb") as f:
                        f.write(img_response.content)
                else:
                    # Fallback: try whatever is available
                    if b64_data:
                        print(f"Decoding base64 image (fallback)...")
                        img_bytes = base64.b64decode(b64_data)
                        with open(output_path, "wb") as f:
                            f.write(img_bytes)
                    elif image_url:
                        print(f"Downloading image from URL (fallback)...")
                        img_response = requests.get(image_url, timeout=60)
                        img_response.raise_for_status()
                        with open(output_path, "wb") as f:
                            f.write(img_response.content)
                    else:
                        raise RuntimeError(f"Unexpected response format. Keys: {list(image_data.keys())}")

                file_size = os.path.getsize(output_path)
                print(f"Image saved to: {output_path} ({file_size / 1024:.0f} KB)")
                return output_path

            elif should_retry(response.status_code) and attempt <= max_retries:
                wait = min(2 ** attempt, 30)  # exponential backoff: 2, 4, 8 seconds, max 30
                print(f"Retryable error {response.status_code}, waiting {wait}s...")
                last_error = RuntimeError(classify_error(response))
                time.sleep(wait)
                continue

            else:
                raise RuntimeError(classify_error(response))

        except requests.exceptions.Timeout:
            print(f"Request timed out after {timeout}s")
            if attempt <= max_retries:
                # Increase timeout for retry
                timeout = min(timeout + 60, 300)
                wait = min(2 ** attempt, 15)
                print(f"Retrying with increased timeout ({timeout}s), waiting {wait}s...")
                last_error = RuntimeError(f"Request timed out after {timeout - 60}s (will retry with {timeout}s timeout)")
                time.sleep(wait)
                continue
            raise RuntimeError(f"Request timed out after {max_retries + 1} attempts")

        except requests.exceptions.ConnectionError as e:
            if attempt <= max_retries:
                wait = min(2 ** attempt, 15)
                print(f"Connection error: {e}, waiting {wait}s...")
                last_error = e
                time.sleep(wait)
                continue
            raise RuntimeError(f"Connection failed after {max_retries + 1} attempts: {e}")

    raise last_error or RuntimeError("Image generation failed")


if __name__ == "__main__":
    if len(sys.argv) < 2 or sys.argv[1] in ("--help", "-h", "help"):
        print("Usage: python generate_image.py <prompt> [output_path] [size] [quality] [response_format]")
        print()
        print("Generate an image using gpt-image-2 API.")
        print()
        print("Arguments:")
        print("  prompt           - Image description (required)")
        print("  output_path      - Where to save the PNG (default: auto-generated from prompt)")
        print("  size             - 1024x1024 (default), 1536x1024, 1024x1536")
        print("  quality          - standard (default) or hd")
        print("  response_format  - b64_json (default) or url")
        print()
        print("Environment variables (from .claude/settings.local.json or .env):")
        print("  IMAGE_BASE_URL   - API base URL")
        print("  IMAGE_API_KEY    - API authentication key")
        print()
        print("Example:")
        print("  python generate_image.py 'a cat in kawaii style' 'cat.png'")
        sys.exit(0)

    prompt = sys.argv[1]
    output_path = sys.argv[2] if len(sys.argv) > 2 else None
    size = sys.argv[3] if len(sys.argv) > 3 else "1024x1024"
    quality = sys.argv[4] if len(sys.argv) > 4 else "standard"
    response_format = sys.argv[5] if len(sys.argv) > 5 else "b64_json"

    try:
        result = generate_image(
            prompt=prompt,
            output_path=output_path,
            size=size,
            quality=quality,
            response_format=response_format,
        )
        print(f"SUCCESS: {result}")
    except Exception as e:
        print(f"ERROR: {e}")
        sys.exit(1)
