from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_http_methods
from .services import DashboardService


@login_required(login_url='accounts:login')
@require_http_methods(["GET"])
def home(request):
    """Display dashboard home page."""
    dashboard_data = DashboardService.get_dashboard_data()
    
    context = {
        'summary': dashboard_data['summary_cards'],
        'recent_transactions': dashboard_data['recent_transactions'],
        'low_stock_items': dashboard_data['low_stock_items'],
        'stock_movement': dashboard_data['stock_movement_data'],
        'category_distribution': dashboard_data['category_distribution'],
    }
    return render(request, 'dashboard/home.html', context)


@login_required(login_url='accounts:login')
@require_http_methods(["GET"])
def analytics(request):
    """Display analytics page."""
    dashboard_data = DashboardService.get_dashboard_data()
    activity_timeline = DashboardService.get_activity_timeline(days=7)
    
    context = {
        'summary': dashboard_data['summary_cards'],
        'stock_movement': dashboard_data['stock_movement_data'],
        'category_distribution': dashboard_data['category_distribution'],
        'activity_timeline': activity_timeline,
    }
    return render(request, 'dashboard/analytics.html', context)
