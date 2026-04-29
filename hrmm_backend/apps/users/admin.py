from django import forms
from django.contrib import admin
from django.contrib.auth.hashers import make_password

from apps.users.models import User


class UserCreationAdminForm(forms.ModelForm):
    password1 = forms.CharField(
        label="Parol",
        widget=forms.PasswordInput,
        min_length=8,
        help_text="Kamida 8 ta belgidan iborat kuchli parol kiriting.",
    )
    password2 = forms.CharField(
        label="Parolni tasdiqlash",
        widget=forms.PasswordInput,
    )

    class Meta:
        model = User
        fields = (
            "username",
            "email",
            "full_name",
            "role",
            "job_role",
            "job_level",
            "department_id",
            "unit_id",
            "is_active",
            "phone",
            "avatar_url",
        )

    def clean_username(self):
        username = (self.cleaned_data.get("username") or "").strip()
        if User.objects.filter(username__iexact=username).exists():
            raise forms.ValidationError("Bu username allaqachon mavjud.")
        return username

    def clean_email(self):
        email = (self.cleaned_data.get("email") or "").strip().lower()
        if User.objects.filter(email__iexact=email).exists():
            raise forms.ValidationError("Bu email allaqachon mavjud.")
        return email

    def clean(self):
        cleaned_data = super().clean()
        password1 = cleaned_data.get("password1")
        password2 = cleaned_data.get("password2")

        if password1 and password2 and password1 != password2:
            self.add_error("password2", "Parollar bir xil emas.")

        return cleaned_data

    def save(self, commit=True):
        user = super().save(commit=False)
        user.username = user.username.strip()
        user.email = user.email.strip().lower()
        user.password_hash = make_password(self.cleaned_data["password1"])
        if commit:
            user.save()
        return user


class UserChangeAdminForm(forms.ModelForm):
    new_password = forms.CharField(
        label="Yangi parol",
        widget=forms.PasswordInput,
        required=False,
        min_length=8,
        help_text="Parolni almashtirmoqchi bo'lsangiz yangi parol kiriting.",
    )
    confirm_new_password = forms.CharField(
        label="Yangi parolni tasdiqlash",
        widget=forms.PasswordInput,
        required=False,
    )

    class Meta:
        model = User
        fields = "__all__"

    def clean_username(self):
        username = (self.cleaned_data.get("username") or "").strip()
        existing = User.objects.filter(username__iexact=username).exclude(pk=self.instance.pk)
        if existing.exists():
            raise forms.ValidationError("Bu username allaqachon mavjud.")
        return username

    def clean_email(self):
        email = (self.cleaned_data.get("email") or "").strip().lower()
        existing = User.objects.filter(email__iexact=email).exclude(pk=self.instance.pk)
        if existing.exists():
            raise forms.ValidationError("Bu email allaqachon mavjud.")
        return email

    def clean(self):
        cleaned_data = super().clean()
        new_password = cleaned_data.get("new_password")
        confirm_new_password = cleaned_data.get("confirm_new_password")

        if new_password or confirm_new_password:
            if new_password != confirm_new_password:
                self.add_error("confirm_new_password", "Parollar bir xil emas.")

        return cleaned_data

    def save(self, commit=True):
        user = super().save(commit=False)
        user.username = user.username.strip()
        user.email = user.email.strip().lower()

        new_password = self.cleaned_data.get("new_password")
        if new_password:
            user.password_hash = make_password(new_password)

        if commit:
            user.save()
        return user


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    add_form = UserCreationAdminForm
    form = UserChangeAdminForm
    list_display = ("username", "full_name", "email", "role", "job_role", "job_level", "is_active", "created_at")
    list_filter = ("role", "job_role", "job_level", "is_active", "created_at")
    search_fields = ("username", "full_name", "email")
    ordering = ("-created_at",)
    readonly_fields = ("password_hash", "created_at", "updated_at", "last_login_at", "two_factor_confirmed_at")

    fieldsets = (
        (
            "Asosiy ma'lumotlar",
            {
                "fields": (
                    "username",
                    "email",
                    "full_name",
                    "role",
                    "job_role",
                    "job_level",
                    "is_active",
                )
            },
        ),
        (
            "Tashkiliy bog'lanishlar",
            {
                "fields": (
                    "department_id",
                    "unit_id",
                )
            },
        ),
        (
            "Profil",
            {
                "fields": (
                    "phone",
                    "avatar_url",
                )
            },
        ),
        (
            "Xavfsizlik",
            {
                "fields": (
                    "password_hash",
                    "new_password",
                    "confirm_new_password",
                    "two_factor_enabled",
                    "totp_secret",
                    "two_factor_confirmed_at",
                    "last_login_at",
                )
            },
        ),
        (
            "Tizim",
            {
                "fields": (
                    "created_at",
                    "updated_at",
                )
            },
        ),
    )

    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": (
                    "username",
                    "email",
                    "full_name",
                    "role",
                    "job_role",
                    "job_level",
                    "department_id",
                    "unit_id",
                    "is_active",
                    "phone",
                    "avatar_url",
                    "password1",
                    "password2",
                ),
            },
        ),
    )

    def get_form(self, request, obj=None, **kwargs):
        if obj is None:
            kwargs["form"] = self.add_form
        else:
            kwargs["form"] = self.form
        return super().get_form(request, obj, **kwargs)

