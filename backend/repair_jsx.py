import re

def fix_whitespace_corruption(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Match className={`...`} or className="..."
    # We want to find patterns like 'px - 6', 'p - 3.5', 'bg - blue - 600'
    # but only within strings or template literals assigned to className.
    
    def replace_hyphen_spaces(match):
        val = match.group(0)
        # Remove spaces around hyphens: ' - ' -> '-'
        # But only if it looks like a tailwind class or similar (e.g. text - blue - 500)
        # Avoid breaking actual subtraction if it's in a template literal (though rare in classNames)
        return re.sub(r'\s+-\s+', '-', val)

    # Simple regex to find content within className="..." or className={`...`}
    # This might miss some complex cases but should hit the majority.
    fixed_content = re.sub(r'className=(?:\{`[^`]+`\}|"[^"]+")', replace_hyphen_spaces, content)

    # Also fix SidebarItem's broken classNames if they weren't matched above
    fixed_content = re.sub(r'\s+-\s+', '-', fixed_content) if 'text - [10px]' in fixed_content else fixed_content
    
    # Wait, the above global replace is risky. Let's be more specific.
    # Correcting known patterns
    patterns = [
        (r'px\s+-\s+', 'px-'),
        (r'py\s+-\s+', 'py-'),
        (r'p\s+-\s+', 'p-'),
        (r'w\s+-\s+', 'w-'),
        (r'h\s+-\s+', 'h-'),
        (r'bg\s+-\s+', 'bg-'),
        (r'text\s+-\s+', 'text-'),
        (r'm\s+-\s+', 'm-'),
        (r'rounded\s+-\s+', 'rounded-'),
        (r'shadow\s+-\s+', 'shadow-'),
        (r'border\s+-\s+', 'border-'),
        (r'ring\s+-\s+', 'ring-'),
        (r'gap\s+-\s+', 'gap-'),
        (r'font\s+-\s+', 'font-'),
        (r'opacity\s+-\s+', 'opacity-'),
        (r'transition\s+-\s+', 'transition-'),
        (r'duration\s+-\s+', 'duration-'),
        (r'translate\s+-\s+', 'translate-'),
        (r'scale\s+-\s+', 'scale-'),
        (r'grid\s+-\s+', 'grid-'),
        (r'cols\s+-\s+', 'cols-'),
        (r'whitespace\s+-\s+', 'whitespace-'),
        (r'hover\s+:\s+', 'hover:'),
        (r'focus\s+:\s+', 'focus:'),
        (r'group\s+-\s+hover\s+:\s+', 'group-hover:'),
    ]
    
    for pat, repl in patterns:
        content = re.sub(pat, repl, content)

    # Fix the weird `text - [10px]` specifically
    content = re.sub(r'text\s+-\s+\[', 'text-[', content)
    content = re.sub(r'\s+\]', ']', content)
    
    # Fix broken `w - fit`
    content = re.sub(r'w\s+-\s+fit', 'w-fit', content)

    # Fix `! ==` or `! ==`
    content = re.sub(r'!\s+==', '!==', content)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == "__main__":
    fix_whitespace_corruption('D:/Desktop/med-com/frontend-admin/src/pages/Dashboard.jsx')
    print("Repair complete.")
