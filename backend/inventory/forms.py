from django import forms
from .models import Item, Category, Supplier


class CategoryForm(forms.ModelForm):
    """Form for creating/updating categories."""
    
    class Meta:
        model = Category
        fields = ['title', 'description']
        widgets = {
            'title': forms.TextInput(attrs={'class': 'form-control'}),
            'description': forms.Textarea(attrs={'class': 'form-control', 'rows': 3}),
        }


class SupplierForm(forms.ModelForm):
    """Form for creating/updating suppliers."""
    
    class Meta:
        model = Supplier
        fields = ['name', 'contact_info', 'email', 'phone', 'address']
        widgets = {
            'name': forms.TextInput(attrs={'class': 'form-control'}),
            'contact_info': forms.TextInput(attrs={'class': 'form-control'}),
            'email': forms.EmailInput(attrs={'class': 'form-control'}),
            'phone': forms.TextInput(attrs={'class': 'form-control'}),
            'address': forms.Textarea(attrs={'class': 'form-control', 'rows': 3}),
        }


class ItemForm(forms.ModelForm):
    """Form for creating/updating inventory items."""
    
    class Meta:
        model = Item
        fields = ['name', 'description', 'sku', 'quantity', 'category', 'supplier', 'threshold_level', 'unit_price']
        widgets = {
            'name': forms.TextInput(attrs={'class': 'form-control'}),
            'description': forms.Textarea(attrs={'class': 'form-control', 'rows': 3}),
            'sku': forms.TextInput(attrs={'class': 'form-control'}),
            'quantity': forms.NumberInput(attrs={'class': 'form-control', 'min': '0'}),
            'category': forms.Select(attrs={'class': 'form-control'}),
            'supplier': forms.Select(attrs={'class': 'form-control'}),
            'threshold_level': forms.NumberInput(attrs={'class': 'form-control', 'min': '0'}),
            'unit_price': forms.NumberInput(attrs={'class': 'form-control', 'min': '0', 'step': '0.01'}),
        }


class ItemFilterForm(forms.Form):
    """Form for filtering items."""
    
    search = forms.CharField(
        required=False,
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': 'Search by name or SKU'
        })
    )
    
    category = forms.ModelChoiceField(
        queryset=Category.objects.all(),
        required=False,
        empty_label='All Categories',
        widget=forms.Select(attrs={'class': 'form-control'})
    )
    
    supplier = forms.ModelChoiceField(
        queryset=Supplier.objects.all(),
        required=False,
        empty_label='All Suppliers',
        widget=forms.Select(attrs={'class': 'form-control'})
    )
    
    stock_status = forms.ChoiceField(
        required=False,
        choices=[
            ('', 'All Items'),
            ('in_stock', 'In Stock'),
            ('low_stock', 'Low Stock'),
            ('out_of_stock', 'Out of Stock'),
        ],
        widget=forms.Select(attrs={'class': 'form-control'})
    )
