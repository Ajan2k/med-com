import re

def fix_dashboard(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Fix whitespace corruption in classNames and common patterns
    # Target common Tailwind patterns: w-1, p-4, hover:bg-red-500, etc.
    # We remove spaces around hyphens where it looks like a CSS class or variable
    
    # Identify strings that look like "text - blue - 500" or similar
    # Using a broad approach for alpha-numeric segments separated by " - " or " : "
    # Especially in template literals and className strings.
    
    # Handle the hyphens
    content = re.sub(r'(\w)\s+-\s+(\w)', r'\1-\2', content)
    content = re.sub(r'(\w)\s+-\s+\[', r'\1-[', content)
    content = re.sub(r'\]\s+(\w)', r'] \1', content) # Ensure space after ] if not followed by more class
    content = re.sub(r'(\d)\s+-\s+(\d)', r'\1-\2', content) # p-3.5 etc can have dots too
    content = re.sub(r'(\w)\s+\.\s+(\d)', r'\1.\2', content) # p-3.5
    
    # Handle colons (hover: focus: group-hover:)
    content = re.sub(r'(\w)\s+:\s+(\w)', r'\1:\2', content)

    # 2. Fix the Lucide imports
    # Add Shield, ShieldCheck, ArrowLeft to the list if missing
    import_match = re.search(r"import \{([^}]+)\} from 'lucide-react';", content)
    if import_match:
        icons = [i.strip() for i in import_match.group(1).split(',')]
        required_icons = ['Shield', 'ShieldCheck', 'ArrowLeft', 'ArrowUpRight']
        for icon in required_icons:
            if icon not in icons:
                # Add it if it's used in the file
                if re.search(r'\b' + icon + r'\b', content):
                    icons.append(icon)
        
        # Unique and sorted
        icons = sorted(list(set(icons)))
        new_import = "import {\n    " + ", ".join(icons) + "\n} from 'lucide-react';"
        content = re.sub(r"import \{[^}]+\} from 'lucide-react';", new_import, content)

    # 3. Clean up generic corruption cases
    content = content.replace("! ==", "!==")
    content = content.replace("! =", "!=")
    content = content.replace("= =", "==")
    content = content.replace("< =", "<=")
    content = content.replace("> =", ">=")
    content = content.replace("= >", "=>")
    
    # 4. Fix specific broken template literals
    # `px - 6` -> `px-6`
    content = re.sub(r'px\s+-\s+(\d+)', r'px-\1', content)
    content = re.sub(r'py\s+-\s+(\d+)', r'py-\1', content)
    content = re.sub(r'w\s+-\s+(\d+)', r'w-\1', content)
    
    # 5. Fix suspicious whitespace in JSX tags
    content = re.sub(r'<\s+/', '</', content)
    content = re.sub(r'/\s+>', '/>', content)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == "__main__":
    fix_dashboard('D:/Desktop/med-com/frontend-admin/src/pages/Dashboard.jsx')
    print("Dashboard repaired.")
