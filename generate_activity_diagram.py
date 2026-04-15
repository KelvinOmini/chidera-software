import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch, Circle, Rectangle, Polygon, Wedge
import numpy as np

# Create figure and axis
fig, ax = plt.subplots(1, 1, figsize=(16, 16))
ax.set_xlim(0, 16)
ax.set_ylim(-2, 14)
ax.axis('off')

# Title
ax.text(8, 13.5, 'Inventory Management System - Activity Diagram', 
        fontsize=18, fontweight='bold', ha='center')

# Helper function to draw rounded rectangle (activity)
def draw_activity(ax, x, y, width, height, label, color='lightblue'):
    rect = FancyBboxPatch((x - width/2, y - height/2), width, height,
                          boxstyle="round,pad=0.15",
                          edgecolor='black', facecolor=color,
                          linewidth=2, alpha=0.85)
    ax.add_patch(rect)
    # Handle multi-line labels
    lines = label.split('\n')
    if len(lines) > 1:
        for i, line in enumerate(lines):
            offset = (len(lines) - 1) * 0.15 / 2
            ax.text(x, y + offset - i * 0.15, line, fontsize=9, ha='center', va='center', fontweight='bold')
    else:
        ax.text(x, y, label, fontsize=9, ha='center', va='center', fontweight='bold')

# Helper function to draw decision diamond
def draw_decision(ax, x, y, size=0.5, label=''):
    diamond = Polygon([(x, y + size), (x + size, y), (x, y - size), (x - size, y)],
                     edgecolor='black', facecolor='lightyellow',
                     linewidth=2, alpha=0.85)
    ax.add_patch(diamond)
    if label:
        lines = label.split('\n')
        for i, line in enumerate(lines):
            offset = (len(lines) - 1) * 0.12 / 2
            ax.text(x, y + offset - i * 0.12, line, fontsize=8, ha='center', va='center', fontweight='bold')

# Helper function to draw arrow
def draw_arrow(ax, x1, y1, x2, y2, label='', style='-', color='black'):
    arrow = FancyArrowPatch((x1, y1), (x2, y2),
                           arrowstyle='->', mutation_scale=25,
                           linewidth=2, color=color, linestyle=style)
    ax.add_patch(arrow)
    if label:
        mid_x, mid_y = (x1 + x2) / 2, (y1 + y2) / 2
        ax.text(mid_x + 0.4, mid_y + 0.2, label, fontsize=8, style='italic', fontweight='bold',
                bbox=dict(boxstyle='round,pad=0.4', facecolor='white', edgecolor='gray', alpha=0.9))

# Helper function to draw initial/final node
def draw_node(ax, x, y, node_type='initial', size=0.35):
    if node_type == 'initial':
        circle = Circle((x, y), size, color='black', fill=True, linewidth=2)
        ax.add_patch(circle)
    else:  # final
        circle = Circle((x, y), size, color='black', fill=False, linewidth=2)
        ax.add_patch(circle)
        inner_circle = Circle((x, y), size * 0.6, color='black', fill=True, linewidth=2)
        ax.add_patch(inner_circle)

# Draw swimlanes with better spacing
swimlane_width = 3.2
swimlane_positions = [1.6, 5.2, 8.8, 12.4]
swimlane_labels = ['User', 'System', 'Database', 'Notification']
swimlane_colors = ['#E8F4F8', '#E8F8E8', '#F8F8E8', '#F0E8F8']

for i, (x, label, color) in enumerate(zip(swimlane_positions, swimlane_labels, swimlane_colors)):
    # Draw swimlane background
    rect = Rectangle((x - swimlane_width/2, -1.5), swimlane_width, 14.5,
                     edgecolor='black', facecolor=color, linewidth=2.5, alpha=0.3)
    ax.add_patch(rect)
    # Draw swimlane header
    header = FancyBboxPatch((x - swimlane_width/2, 12.8), swimlane_width, 0.65,
                           boxstyle="round,pad=0.08",
                           edgecolor='black', facecolor='#333333',
                           linewidth=2)
    ax.add_patch(header)
    ax.text(x, 13.15, label, fontsize=11, ha='center', va='center', fontweight='bold', color='white')

# ============ ACTIVITY FLOW ============

# Initial node
draw_node(ax, 1.6, 12.2, 'initial')
draw_arrow(ax, 1.6, 11.85, 1.6, 11.4)

# Admin/Manager: Set Stock Alert Threshold
draw_activity(ax, 1.6, 11, 2.4, 0.7, 'Set Alert\nThreshold', '#ADD8E6')
draw_arrow(ax, 1.6, 10.65, 1.6, 10.1)

# System: Configure Alert Rules
draw_activity(ax, 5.2, 10.1, 2.4, 0.7, 'Configure Alert\nRules', '#90EE90')
draw_arrow(ax, 5.2, 9.75, 5.2, 9.2)

# System: Monitor Stock Levels
draw_activity(ax, 5.2, 8.8, 2.4, 0.7, 'Monitor Stock\nLevels', '#90EE90')
draw_arrow(ax, 5.2, 8.45, 5.2, 7.9)

# Decision: Stock Below Threshold?
draw_decision(ax, 5.2, 7.4, 0.45, 'Stock\nLow?')

# NO path - Continue monitoring
draw_arrow(ax, 5.65, 7.4, 8.2, 7.4, 'No', color='#228B22')
draw_arrow(ax, 8.2, 7.4, 8.2, 8.8)
draw_arrow(ax, 8.2, 8.8, 5.2, 8.8)

# YES path - Trigger Alert
draw_arrow(ax, 5.2, 6.95, 5.2, 6.4, 'Yes', color='#DC143C')

# System: Trigger Alert
draw_activity(ax, 5.2, 6, 2.4, 0.7, 'Trigger Alert\nNotification', '#90EE90')
draw_arrow(ax, 5.2, 5.65, 8.8, 5.3, 'Send')

# Database: Log Alert Event
draw_activity(ax, 8.8, 4.9, 2.4, 0.7, 'Log Alert\nEvent', '#FFFFE0')
draw_arrow(ax, 8.8, 4.55, 8.8, 4)

# Database: Record Alert History
draw_activity(ax, 8.8, 3.6, 2.4, 0.7, 'Record Alert\nHistory', '#FFFFE0')
draw_arrow(ax, 8.8, 3.25, 12.4, 2.9, 'Notify')

# Notification: Send Email Alert
draw_activity(ax, 12.4, 2.5, 2.4, 0.7, 'Send Email\nAlert', '#E6E6FA')
draw_arrow(ax, 12.4, 2.15, 12.4, 1.6)

# Notification: Send SMS Alert
draw_activity(ax, 12.4, 1.2, 2.4, 0.7, 'Send SMS\nAlert', '#E6E6FA')
draw_arrow(ax, 12.4, 0.85, 12.4, 0.3)

# Notification: Display Dashboard Alert
draw_activity(ax, 12.4, -0.5, 2.4, 0.7, 'Display\nDashboard Alert', '#E6E6FA')

# Final node
draw_node(ax, 1.6, -1.2, 'final')
draw_arrow(ax, 12.4, -0.85, 1.6, -1.2)

plt.tight_layout()
plt.savefig('/Users/masterkelvin/Documents/Chidera/inventory_system/activity_diagram.png', 
            dpi=300, bbox_inches='tight', facecolor='white')
print("✓ Activity diagram created successfully: activity_diagram.png")
plt.show()
