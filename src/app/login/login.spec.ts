import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LoginComponent } from './login';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [LoginComponent, FormsModule],
      providers: [
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty form', () => {
    expect(component.loginForm.email).toBe('');
    expect(component.loginForm.password).toBe('');
    expect(component.loginForm.rememberMe).toBe(false);
  });

  it('should show error message when form is submitted with empty fields', () => {
    component.onSubmit();
    expect(component.errorMessage).toBe('Please fill in all required fields.');
  });

  it('should toggle password visibility', () => {
    expect(component.showPassword).toBe(false);
    component.togglePasswordVisibility();
    expect(component.showPassword).toBe(true);
    component.togglePasswordVisibility();
    expect(component.showPassword).toBe(false);
  });

  it('should navigate to home on successful login', (done) => {
    component.loginForm.email = 'test@example.com';
    component.loginForm.password = 'password123';
    
    component.onSubmit();
    expect(component.isLoading).toBe(true);
    
    setTimeout(() => {
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/home']);
      expect(component.isLoading).toBe(false);
      done();
    }, 1600);
  });
});
