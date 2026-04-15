from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.views.decorators.http import require_http_methods
from django.db.models import Q
from .models import CustomUser
from .forms import CustomUserCreationForm, CustomUserChangeForm, ProfileForm, LoginForm
from .decorators import admin_required


@require_http_methods(["GET", "POST"])
def login_view(request):
    """Handle user login."""
    if request.user.is_authenticated:
        return redirect('dashboard:home')
    
    if request.method == 'POST':
        form = LoginForm(request.POST)
        if form.is_valid():
            username = form.cleaned_data['username']
            password = form.cleaned_data['password']
            user = authenticate(request, username=username, password=password)
            
            if user is not None:
                login(request, user)
                
                # Handle remember me
                if not form.cleaned_data.get('remember_me'):
                    # Session expires when browser closes
                    request.session.set_expiry(0)
                else:
                    # Session lasts 2 weeks (default)
                    request.session.set_expiry(1209600)
                
                messages.success(request, f'Welcome back, {user.get_full_name() or user.username}!')
                
                # Redirect to 'next' URL if provided, otherwise dashboard
                next_url = request.GET.get('next', 'dashboard:home')
                return redirect(next_url)
            else:
                messages.error(request, 'Invalid username or password.')
    else:
        form = LoginForm()
    
    return render(request, 'accounts/login.html', {'form': form})


@login_required(login_url='accounts:login')
@require_http_methods(["POST"])
def logout_view(request):
    """Handle user logout. POST-only to prevent CSRF logout attacks."""
    logout(request)
    messages.success(request, 'You have been logged out successfully.')
    return redirect('accounts:login')


@admin_required
@require_http_methods(["GET", "POST"])
def user_list(request):
    """Display list of all users."""
    users = CustomUser.objects.all()
    
    # Search functionality
    search_query = request.GET.get('search', '')
    if search_query:
        users = users.filter(
            Q(username__icontains=search_query) |
            Q(email__icontains=search_query) |
            Q(first_name__icontains=search_query) |
            Q(last_name__icontains=search_query)
        )
    
    # Filter by role
    role_filter = request.GET.get('role', '')
    if role_filter:
        users = users.filter(role=role_filter)
    
    context = {
        'users': users,
        'search_query': search_query,
        'role_filter': role_filter,
        'role_choices': CustomUser.ROLE_CHOICES,
    }
    return render(request, 'accounts/user_list.html', context)


@admin_required
@require_http_methods(["GET", "POST"])
def user_create(request):
    """Create a new user."""
    if request.method == 'POST':
        form = CustomUserCreationForm(request.POST)
        if form.is_valid():
            user = form.save()
            messages.success(request, f'User {user.username} created successfully.')
            return redirect('accounts:user_list')
    else:
        form = CustomUserCreationForm()
    
    return render(request, 'accounts/user_form.html', {'form': form, 'title': 'Create User'})


@admin_required
@require_http_methods(["GET", "POST"])
def user_update(request, pk):
    """Update user information."""
    user = get_object_or_404(CustomUser, pk=pk)
    
    if request.method == 'POST':
        form = CustomUserChangeForm(request.POST, instance=user)
        if form.is_valid():
            form.save()
            messages.success(request, f'User {user.username} updated successfully.')
            return redirect('accounts:user_list')
    else:
        form = CustomUserChangeForm(instance=user)
    
    return render(request, 'accounts/user_form.html', {
        'form': form,
        'title': f'Edit User: {user.username}',
        'user_obj': user
    })


@admin_required
@require_http_methods(["POST"])
def user_delete(request, pk):
    """Delete a user."""
    user = get_object_or_404(CustomUser, pk=pk)
    username = user.username
    user.delete()
    messages.success(request, f'User {username} deleted successfully.')
    return redirect('accounts:user_list')


@login_required(login_url='accounts:login')
@require_http_methods(["GET", "POST"])
def profile_view(request):
    """View and edit user profile. Uses ProfileForm which excludes role field."""
    user = request.user
    
    if request.method == 'POST':
        form = ProfileForm(request.POST, instance=user)
        if form.is_valid():
            form.save()
            messages.success(request, 'Profile updated successfully.')
            return redirect('accounts:profile')
    else:
        form = ProfileForm(instance=user)
    
    return render(request, 'accounts/profile.html', {'form': form, 'user_obj': user})
