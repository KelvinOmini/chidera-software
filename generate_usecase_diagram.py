import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch, Circle, Rectangle
import numpy as np

# Create figure and axis
fig, ax = plt.subplots(1, 1, figsize=(14, 10))
ax.set_xlim(0, 14)
ax.set_ylim(0, 10)
ax.axis('off')

# Title
ax.text(7, 9.5, 'Inventory Management System - Use Case Diagram', 
        fontsize=16, fontweight='bold', ha='center')

# System boundary box
system_box = FancyBboxPatch((2, 0.5), 10, 8, 
                            boxstyle="round,pad=0.1", 
                            edgecolor='black', facecolor='lightblue', 
                            linewidth=2, alpha=0.2)
ax.add_patch(system_box)
ax.text(7, 8.3, 'Inventory Management System', fontsize=11, ha='center', fontweight='bold')

# Actors (outside the system)
# Admin
admin_circle = Circle((0.8, 6.5), 0.3, color='black', fill=False, linewidth=2)
ax.add_patch(admin_circle)
ax.text(0.8, 5.9, 'Admin', fontsize=10, ha='center', fontweight='bold')

# Store Manager
manager_circle = Circle((0.8, 3.5), 0.3, color='black', fill=False, linewidth=2)
ax.add_patch(manager_circle)
ax.text(0.8, 2.9, 'Store Manager', fontsize=10, ha='center', fontweight='bold')

# Staff
staff_circle = Circle((0.8, 0.8), 0.3, color='black', fill=False, linewidth=2)
ax.add_patch(staff_circle)
ax.text(0.8, 0.2, 'Staff', fontsize=10, ha='center', fontweight='bold')

# Supplier (external actor)
supplier_circle = Circle((13.2, 4), 0.3, color='black', fill=False, linewidth=2)
ax.add_patch(supplier_circle)
ax.text(13.2, 3.4, 'Supplier', fontsize=10, ha='center', fontweight='bold')

# Use cases (ellipses)
use_cases = [
    # (x, y, width, height, label, color)
    (3.5, 7.5, 2, 0.6, 'Manage Products', 'lightyellow'),
    (6.5, 7.5, 2, 0.6, 'Track Stock', 'lightyellow'),
    (9.5, 7.5, 2, 0.6, 'Generate Reports', 'lightyellow'),
    
    (3.5, 4.1, 2, 0.6, 'Process Sales', 'lightcoral'),
    (6.5, 4.1, 2, 0.6, 'Set Stock Alerts', 'lightcoral'),
    (9.5, 4.1, 2, 0.6, 'View Inventory', 'lightcoral'),
    
    (3.5, 2.4, 2, 0.6, 'Manage Users', 'lightgray'),
    (6.5, 2.4, 2, 0.6, 'System Settings', 'lightgray'),
    (9.5, 2.4, 2, 0.6, 'Audit Logs', 'lightgray'),
]

# Draw use cases
for x, y, w, h, label, color in use_cases:
    ellipse = patches.Ellipse((x, y), w, h, 
                             edgecolor='black', facecolor=color, 
                             linewidth=1.5, alpha=0.7)
    ax.add_patch(ellipse)
    ax.text(x, y, label, fontsize=9, ha='center', va='center', fontweight='bold')

# Draw associations (lines from actors to use cases)
# Admin associations
admin_x, admin_y = 1.1, 6.5
associations_admin = [
    (3.5, 7.5),   # Manage Products
    (6.5, 7.5),   # Track Stock
    (9.5, 7.5),   # Generate Reports
    (6.5, 4.1),   # Set Stock Alerts
    (3.5, 2.4),   # Manage Users
    (6.5, 2.4),   # System Settings
    (9.5, 2.4),   # Audit Logs
]

for uc_x, uc_y in associations_admin:
    ax.plot([admin_x, uc_x], [admin_y, uc_y], 'k-', linewidth=1, alpha=0.5)

# Store Manager associations
manager_x, manager_y = 1.1, 3.5
associations_manager = [
    (3.5, 4.1),   # Process Sales
    (6.5, 4.1),   # Set Stock Alerts
    (9.5, 4.1),   # View Inventory
    (9.5, 7.5),   # Generate Reports
]

for uc_x, uc_y in associations_manager:
    ax.plot([manager_x, uc_x], [manager_y, uc_y], 'k-', linewidth=1, alpha=0.5)

# Staff associations
staff_x, staff_y = 1.1, 0.8
associations_staff = [
    (3.5, 4.1),   # Process Sales
    (9.5, 4.1),   # View Inventory
]

for uc_x, uc_y in associations_staff:
    ax.plot([staff_x, uc_x], [staff_y, uc_y], 'k-', linewidth=1, alpha=0.5)

# Supplier associations
supplier_x, supplier_y = 12.9, 4
associations_supplier = []

for uc_x, uc_y in associations_supplier:
    ax.plot([supplier_x, uc_x], [supplier_y, uc_y], 'k--', linewidth=1.5, alpha=0.6)

# Add legend
legend_y = 0.3
ax.text(2, legend_y, '— Solid line: System Actor', fontsize=8, style='italic')
ax.text(6, legend_y, '-- Dashed line: External Actor', fontsize=8, style='italic')

plt.tight_layout()
plt.savefig('/Users/masterkelvin/Documents/Chidera/inventory_system/usecase_diagram.png', 
            dpi=300, bbox_inches='tight', facecolor='white')
print("✓ Use case diagram created successfully: usecase_diagram.png")
plt.show()
