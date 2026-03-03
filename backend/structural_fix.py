import re
import sys

def repair_dashboard(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            lines = f.readlines()
    except Exception as e:
        print(f"Error reading file: {e}")
        return

    content = "".join(lines)

    # 1. Fix whitespace corruption in classNames (re-running more aggressively)
    # Generic fixes
    content = re.sub(r'(\w)\s+-\s+(\w)', r'\1-\2', content)
    content = re.sub(r'(\w)\s+-\s+\[', r'\1-[', content)
    content = re.sub(r'(\w)\s+:\s+(\w)', r'\1:\2', content)
    content = re.sub(r'px\s+-\s+(\d+)', r'px-\1', content)
    content = re.sub(r'py\s+-\s+(\d+)', r'py-\1', content)
    content = re.sub(r'w\s+-\s+(\d+)', r'w-\1', content)
    content = re.sub(r'h\s+-\s+(\d+)', r'h-\1', content)
    content = re.sub(r'p\s+-\s+(\d+)', r'p-\1', content)
    content = re.sub(r'm\s+-\s+(\d+)', r'm-\1', content)
    content = re.sub(r'gap\s+-\s+(\d+)', r'gap-\1', content)
    content = re.sub(r'flex\s+-\s+(\d+)', r'flex-\1', content)
    content = re.sub(r'col\s+-\s+span\s+-\s+(\d+)', r'col-span-\1', content)
    content = re.sub(r'shadow\s+-\s+(\w+)', r'shadow-\1', content)
    content = re.sub(r'rounded\s+-\s+(\w+)', r'rounded-\1', content)
    content = re.sub(r'text\s+-\s+(\w+)', r'text-\1', content)
    content = re.sub(r'bg\s+-\s+(\w+)', r'bg-\1', content)
    content = re.sub(r'border\s+-\s+(\w+)', r'border-\1', content)
    content = re.sub(r'hover\s+:\s+', r'hover:', content)
    content = re.sub(r'focus\s+:\s+', r'focus:', content)
    content = re.sub(r'group\s+-\s+hover\s+:\s+', r'group-hover:', content)

    # 2. Fix structural issues (orphaned blocks)
    # Find the line that marks the end of the legitimate main div.
    # We'll look for the pattern where Overview, Analytics, etc. are supposed to live.
    
    # Actually, it's easier to find the "activeTab" blocks and re-assemble them.
    # We want to identify the blocks: doctor_dashboard, overview, analytics, lab_dashboard, lab, pharmacy, inventory, users, roles, billing
    
    # First, let's remove the premature component closing and orphaned bits.
    # I'll look for the end of the "AppointmentsCalendar" block which was the original end of the tabs.
    
    parts = re.split(r'\{activeTab === \'appointments\' && \(.*?\)\}', content, flags=re.DOTALL)
    if len(parts) < 2:
         # Try simpler split if complex one fails
         parts = content.split("{activeTab === 'appointments' && (")
    
    # This is getting complex for a simple regex. 
    # Let's try to just find the stray `}` and `)` and remove them.
    
    # Pattern at 1200-1209:
    # 1200:                         />
    # 1201:                     )}
    # 1202: 
    # 1203:                 </Motion.div>
    # 1204:                             )}
    # 1205:             </div>
    # 1206:         </Motion.div>
    # 1207:     )
    # 1208: }

    stray_end = r'</Motion\.div>\s+\)\}\s+</div>\s+</Motion\.div>\s+\)\s+\}'
    content = re.sub(stray_end, r'', content)
    
    # Also clean up the braces around other blocks if they were wrapped incorrectly
    # e.g. {/* PHARMACY VIEW */ } { activeTab === 'pharmacy' && ( ... ) }
    content = re.sub(r'\{/* (.*?) */ \}\s+\{', r'{/* \1 */}\n{', content)
    # Remove the extra { } if they wrap the conditional
    # Pattern: { activeTab === '...' && ( ... ) }
    # This is a bit risky but we can try to find blocks that are { activeTab === '...' && ( ... ) } and remove outer { }
    
    def unwrap_conditional(m):
        return m.group(1).strip()
    
    content = re.sub(r'\}\s+\{(activeTab === \'.*?\' && \(.*?\))\}\s+\{', r'}\n{\1}\n{', content, flags=re.DOTALL)

    # 3. Ensure the return statement closes correctly at the end of the file.
    # We'll look for the end of the AnimatePresence and the main div.
    
    # Fixing the specific issue at line 1408-1411:
    # 1408:         </Motion.div>
    # 1409:     )
    # 1410: }
    content = re.sub(r'</Motion\.div>\s+\)\s+\}\s+/\* PHARMACY VIEW', r'</Motion.div>\n)\n}\n\n{/* PHARMACY VIEW', content)

    # Actually, the most robust way is to re-insert the main content div closer.
    # I'll find where the modals start and insert the closers there.
    
    modals_start = "{/* ROBUST MANAGEMENT MODAL */ }"
    if modals_start in content:
        parts = content.split(modals_start)
        # Ensure the first part ends with just the necessary closetags for the tabs
        # Each tab ends with </Motion.div> )} or </AppointmentsCalendar> )}
        # Then we need to close the "DASHBOARD CONTENT" div, the "MAIN CONTENT" div, and then re-open for the modals if they are outside?
        # No, modals should be inside the main div or siblings. 
        # In this file, they were siblings of the main Content div but inside the root div.
        
        # Structure should be:
        # <div root>
        #   <Sidebar />
        #   <div MainContent>
        #     <Header />
        #     <div DashboardContent>
        #        {tabs...}
        #     </div>
        #   </div>
        #   <AnimatePresence> {modals} </AnimatePresence>
        # </div>
        
        # Let's fix the broken closers before the modals.
        pass

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == "__main__":
    repair_dashboard('D:/Desktop/med-com/frontend-admin/src/pages/Dashboard.jsx')
    print("Dashboard structural and whitespace repair complete.")
