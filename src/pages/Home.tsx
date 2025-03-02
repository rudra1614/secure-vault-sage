
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, Lock, Key, Database, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const Home = () => {
  const navigate = useNavigate();
  const featuresRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState<{[key: string]: boolean}>({
    hero: false,
    features: false,
    testimonials: false
  });

  // Scroll to features section
  const scrollToFeatures = () => {
    featuresRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Animation on scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(prev => ({...prev, [entry.target.id]: true}));
          }
        });
      },
      { threshold: 0.1 }
    );

    const sections = document.querySelectorAll(".animate-on-scroll");
    sections.forEach((section) => {
      observer.observe(section);
    });

    return () => {
      sections.forEach((section) => {
        observer.unobserve(section);
      });
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary/5 via-secondary/5 to-background overflow-x-hidden">
      {/* Hero Section with Animation */}
      <div 
        id="hero" 
        className={`min-h-screen flex items-center justify-center animate-on-scroll transition-all duration-1000 ${
          isVisible.hero ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        }`}
      >
        <div className="container px-4 text-center space-y-8 relative">
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
          </div>

          <div className="flex justify-center mb-8">
            <div className="bg-primary/10 p-4 rounded-full animate-pulse">
              <Shield className="h-16 w-16 text-primary" />
            </div>
          </div>

          <h1 className="text-4xl md:text-7xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            <span className="inline-block animate-[fadeIn_1s_ease-in-out]">Secure</span>
            <span className="inline-block animate-[fadeIn_1s_ease-in-out_0.3s]">Vault</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-[700px] mx-auto animate-[fadeIn_1.5s_ease-in-out]">
            Your trusted guardian for digital credentials. Store, manage, and access your passwords with military-grade encryption.
          </p>

          <div className="flex flex-col md:flex-row gap-4 justify-center items-center animate-[fadeIn_2s_ease-in-out]">
            <Button
              size="lg"
              onClick={() => navigate("/auth")}
              className="min-w-[200px] text-lg hover:scale-105 transition-transform"
            >
              <Lock className="mr-2 h-5 w-5" />
              Get Started
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate("/auth")}
              className="min-w-[200px] text-lg hover:scale-105 transition-transform"
            >
              <Key className="mr-2 h-5 w-5" />
              Sign In
            </Button>
          </div>

          <div className="mt-16 animate-bounce">
            <Button 
              variant="ghost" 
              onClick={scrollToFeatures} 
              className="rounded-full p-2"
            >
              <ChevronDown className="h-8 w-8" />
            </Button>
          </div>
        </div>
      </div>

      {/* Features with Animations */}
      <div 
        id="features" 
        ref={featuresRef}
        className={`py-20 animate-on-scroll transition-all duration-1000 ${
          isVisible.features ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        }`}
      >
        <div className="container px-4">
          <h2 className="text-3xl md:text-5xl font-bold text-center mb-16 bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">
            Security for Modern Digital Life
          </h2>

          <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {/* Feature 1 - Left image */}
            <div className="overflow-hidden rounded-2xl shadow-xl">
              <img 
                src="https://images.unsplash.com/photo-1506744038136-46273834b3fb" 
                alt="Secure Environment" 
                className="w-full h-64 md:h-full object-cover transition-transform hover:scale-105 duration-700" 
              />
            </div>
            <div className="flex flex-col justify-center space-y-4">
              <div className="bg-primary/10 p-3 rounded-full w-fit">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold">Secure Storage</h3>
              <p className="text-muted-foreground text-lg">
                End-to-end encryption ensures your data stays private and protected. 
                We use AES-256 encryption, the same standard trusted by governments 
                and security experts worldwide.
              </p>
            </div>

            {/* Feature 2 - Right image */}
            <div className="flex flex-col justify-center space-y-4 md:order-1">
              <div className="bg-primary/10 p-3 rounded-full w-fit">
                <Database className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold">Cloud Sync</h3>
              <p className="text-muted-foreground text-lg">
                Access your passwords securely from any device, anywhere. 
                Your data syncs automatically so you'll always have your 
                credentials when you need them most.
              </p>
            </div>
            <div className="overflow-hidden rounded-2xl shadow-xl md:order-2">
              <img 
                src="https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7" 
                alt="Cloud Technology" 
                className="w-full h-64 md:h-full object-cover transition-transform hover:scale-105 duration-700" 
              />
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div 
        id="testimonials" 
        className={`py-20 bg-card/50 animate-on-scroll transition-all duration-1000 ${
          isVisible.testimonials ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        }`}
      >
        <div className="container px-4">
          <h2 className="text-3xl md:text-5xl font-bold text-center mb-16 bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">
            Trusted by Thousands
          </h2>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Testimonial Cards */}
            <div className="bg-card border border-border/50 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex flex-col h-full justify-between">
                <div className="space-y-4">
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg key={star} className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-muted-foreground">
                    "SecureVault has completely transformed how I manage my passwords. I feel so much safer knowing my data is properly encrypted."
                  </p>
                </div>
                <div className="mt-6 pt-6 border-t border-border">
                  <p className="font-medium">Sarah Johnson</p>
                  <p className="text-sm text-muted-foreground">Digital Marketer</p>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border/50 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex flex-col h-full justify-between">
                <div className="space-y-4">
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg key={star} className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-muted-foreground">
                    "The interface is intuitive, and the security features are top-notch. I've recommended SecureVault to all my colleagues."
                  </p>
                </div>
                <div className="mt-6 pt-6 border-t border-border">
                  <p className="font-medium">Michael Chen</p>
                  <p className="text-sm text-muted-foreground">IT Professional</p>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border/50 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex flex-col h-full justify-between">
                <div className="space-y-4">
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg key={star} className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-muted-foreground">
                    "After experiencing a data breach with another service, I switched to SecureVault. The peace of mind is well worth it."
                  </p>
                </div>
                <div className="mt-6 pt-6 border-t border-border">
                  <p className="font-medium">David Williams</p>
                  <p className="text-sm text-muted-foreground">Small Business Owner</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-16 text-center">
            <Button
              size="lg"
              onClick={() => navigate("/auth")}
              className="min-w-[200px] text-lg hover:scale-105 transition-transform"
            >
              <Shield className="mr-2 h-5 w-5" />
              Secure Your Passwords Now
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-auto py-8 text-center text-sm text-muted-foreground border-t border-border/30">
        <div className="container">
          <p>© 2024 SecureVault. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
