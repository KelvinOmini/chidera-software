from operations.models import Alert

def alert_context(request):
    """
    Context processor to provide alert badge count and active alerts to all templates.
    """
    if request.user.is_authenticated:
        unresolved_alerts = Alert.objects.filter(is_resolved=False).select_related('item')
        return {
            'alert_badge_count': unresolved_alerts.count(),
            'active_alerts': unresolved_alerts[:5],
        }
    return {
        'alert_badge_count': 0,
        'active_alerts': [],
    }
