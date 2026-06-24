from django import forms
from .models import StockTransaction
from inventory.models import Item


class StockTransactionForm(forms.ModelForm):
    """Form for creating stock transactions."""
    
    class Meta:
        model = StockTransaction
        fields = ['item', 'transaction_type', 'quantity_changed', 'notes']
        widgets = {
            'item': forms.Select(attrs={'class': 'form-control'}),
            'transaction_type': forms.Select(attrs={'class': 'form-control'}),
            'quantity_changed': forms.NumberInput(attrs={
                'class': 'form-control',
                'min': '1',
                'placeholder': 'Enter quantity'
            }),
            'notes': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 3,
                'placeholder': 'Optional notes'
            }),
        }
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['item'].queryset = Item.objects.select_related('category', 'supplier')
