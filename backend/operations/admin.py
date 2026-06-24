from django.contrib import admin
from .models import StockTransaction


@admin.register(StockTransaction)
class StockTransactionAdmin(admin.ModelAdmin):
    list_display = ('item', 'transaction_type', 'quantity_changed', 'previous_quantity', 'new_quantity', 'user', 'timestamp')
    list_filter = ('transaction_type', 'timestamp', 'item__category')
    search_fields = ('item__name', 'item__sku', 'notes', 'user__username')
    readonly_fields = ('previous_quantity', 'new_quantity', 'timestamp')
    fieldsets = (
        ('Transaction Information', {
            'fields': ('item', 'transaction_type', 'quantity_changed')
        }),
        ('Stock Details', {
            'fields': ('previous_quantity', 'new_quantity')
        }),
        ('User Information', {
            'fields': ('user', 'timestamp')
        }),
        ('Notes', {
            'fields': ('notes',),
            'classes': ('collapse',)
        }),
    )
    ordering = ('-timestamp',)
