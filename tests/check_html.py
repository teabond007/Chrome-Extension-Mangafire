
import re

def check_nesting(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    stack = []
    line_num = 0
    for line in lines:
        line_num += 1
        # Match opening and closing divs
        # Simplified: just count <div and </div
        # Better: use regex to find tags
        tags = re.findall(r'<(/?div|main|aside|header|/main|/aside|/header|section|/section|html|/html|body|/body)', line)
        for tag in tags:
            if tag.startswith('/'):
                if not stack:
                    print(f"Error: Unexpected closing tag <{tag}> at line {line_num}")
                else:
                    opening = stack.pop()
                    if opening != tag[1:]:
                        print(f"Error: Mismatched tag. Expected </{opening}> but found <{tag}> at line {line_num}")
            else:
                stack.append(tag)
    
    if stack:
        print("Error: Unclosed tags at end of file:")
        for tag in stack:
            print(f" - <{tag}>")

if __name__ == "__main__":
    check_nesting(r'c:\work\Chrome Extension Mangafire\options\options.html')
