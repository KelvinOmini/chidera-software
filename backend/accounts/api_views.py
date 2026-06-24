from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import CustomUser
from .serializers import UserSerializer, UserCreateSerializer, ProfileSerializer
from .permissions import IsAdminUser


class UserViewSet(viewsets.ModelViewSet):
    """
    API endpoint for user management (admin only).
    
    list: Get all users.
    create: Create a new user.
    retrieve: Get user details.
    update: Update a user.
    destroy: Delete a user.
    """
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['username', 'email', 'first_name', 'last_name']
    ordering_fields = ['username', 'date_created', 'role']
    ordering = ['-date_created']
    
    def get_queryset(self):
        queryset = CustomUser.objects.all()
        role = self.request.query_params.get('role')
        if role:
            queryset = queryset.filter(role=role)
        return queryset
    
    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        return UserSerializer


class ProfileViewSet(viewsets.GenericViewSet):
    """
    API endpoint for the current user's profile.
    
    me: Get current user profile.
    update_me: Update current user profile (role is read-only).
    """
    serializer_class = ProfileSerializer
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        """Get current user's profile."""
        serializer = ProfileSerializer(request.user)
        return Response(serializer.data)
    
    @action(detail=False, methods=['put', 'patch'])
    def update_me(self, request):
        """Update current user's profile (cannot change own role)."""
        serializer = ProfileSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
