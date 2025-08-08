import { Shield, Eye, Lock, UserCheck } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="gradient-hero text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">Privacy Policy</h1>
            <p className="text-xl md:text-2xl text-white/90">
              Your privacy is important to us. Learn how we protect your information.
            </p>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Introduction */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Introduction
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-lg max-w-none">
              <p>
                This Privacy Policy describes how our restaurant ("we," "our," or "us") collects, uses, and protects 
                your personal information when you use our food delivery service. We are committed to protecting your 
                privacy and ensuring the security of your personal information.
              </p>
              <p className="text-sm text-muted-foreground mt-4">
                <strong>Last updated:</strong> January 2024
              </p>
            </CardContent>
          </Card>

          {/* Information We Collect */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Information We Collect
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Personal Information</h3>
                  <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                    <li>Name and contact information (phone number, email address)</li>
                    <li>Delivery addresses</li>
                    <li>Payment information (processed securely through third-party payment processors)</li>
                    <li>Order history and preferences</li>
                    <li>Account login credentials</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Automatically Collected Information</h3>
                  <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                    <li>Device information (IP address, browser type, operating system)</li>
                    <li>Usage data (pages visited, time spent on our service)</li>
                    <li>Location data (when you enable location services)</li>
                    <li>Cookies and similar tracking technologies</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Information from Third Parties</h3>
                  <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                    <li>Social media platforms (if you choose to connect your accounts)</li>
                    <li>Payment processors</li>
                    <li>Delivery partners</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* How We Use Your Information */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                How We Use Your Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Service Delivery</h3>
                  <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                    <li>Process and fulfill your food orders</li>
                    <li>Communicate with you about your orders</li>
                    <li>Provide customer support</li>
                    <li>Send order confirmations and delivery updates</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Account Management</h3>
                  <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                    <li>Create and maintain your account</li>
                    <li>Remember your preferences and order history</li>
                    <li>Authenticate your identity</li>
                    <li>Provide personalized experiences</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Marketing and Communications</h3>
                  <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                    <li>Send promotional offers and updates (with your consent)</li>
                    <li>Notify you about new menu items and services</li>
                    <li>Conduct surveys and gather feedback</li>
                    <li>Send important service announcements</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Business Operations</h3>
                  <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                    <li>Analyze usage patterns to improve our service</li>
                    <li>Prevent fraud and ensure security</li>
                    <li>Comply with legal obligations</li>
                    <li>Resolve disputes and enforce our terms</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Information Sharing */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Information Sharing and Disclosure</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  We do not sell, trade, or otherwise transfer your personal information to third parties except in the following circumstances:
                </p>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Service Providers</h3>
                  <p className="text-muted-foreground">
                    We may share your information with trusted third-party service providers who assist us in operating our 
                    service, such as payment processors, delivery partners, and cloud hosting providers.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Legal Requirements</h3>
                  <p className="text-muted-foreground">
                    We may disclose your information if required by law, court order, or governmental authority, or to 
                    protect our rights, property, or safety.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3">Business Transfers</h3>
                  <p className="text-muted-foreground">
                    In the event of a merger, acquisition, or sale of assets, your information may be transferred as part 
                    of the business transaction.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Security */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Data Security
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  We implement appropriate technical and organizational security measures to protect your personal information against 
                  unauthorized access, alteration, disclosure, or destruction. These measures include:
                </p>

                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Encryption of data in transit and at rest</li>
                  <li>Regular security assessments and updates</li>
                  <li>Access controls and authentication requirements</li>
                  <li>Secure payment processing through PCI-compliant providers</li>
                  <li>Regular backup and disaster recovery procedures</li>
                </ul>

                <p className="text-muted-foreground">
                  However, no method of transmission over the internet or electronic storage is 100% secure. While we strive to 
                  use commercially acceptable means to protect your information, we cannot guarantee its absolute security.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Your Rights */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Your Rights and Choices</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  You have certain rights regarding your personal information:
                </p>

                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li><strong>Access:</strong> You can request a copy of the personal information we hold about you</li>
                  <li><strong>Correction:</strong> You can update or correct inaccurate information in your account</li>
                  <li><strong>Deletion:</strong> You can request deletion of your personal information (subject to legal obligations)</li>
                  <li><strong>Opt-out:</strong> You can unsubscribe from marketing communications at any time</li>
                  <li><strong>Data Portability:</strong> You can request your data in a portable format</li>
                  <li><strong>Restriction:</strong> You can request limitation of processing under certain circumstances</li>
                </ul>

                <p className="text-muted-foreground">
                  To exercise these rights, please contact us using the information provided below.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Data Retention */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Data Retention</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                We retain your personal information for as long as necessary to fulfill the purposes outlined in this privacy policy, 
                unless a longer retention period is required or permitted by law. When we no longer need your information, we will 
                securely delete or anonymize it.
              </p>
            </CardContent>
          </Card>

          {/* Cookies */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Cookies and Tracking Technologies</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  We use cookies and similar technologies to enhance your experience on our service. These technologies help us:
                </p>

                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Remember your preferences and login information</li>
                  <li>Analyze how our service is used</li>
                  <li>Provide personalized content and advertisements</li>
                  <li>Improve our service functionality</li>
                </ul>

                <p className="text-muted-foreground">
                  You can control cookies through your browser settings, but disabling cookies may affect your ability to use certain 
                  features of our service.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Us</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  If you have any questions about this Privacy Policy or our data practices, please contact us:
                </p>

                <div className="bg-secondary/30 p-4 rounded-lg">
                  <div className="space-y-2">
                    <p><strong>Email:</strong> privacy@restaurant.com</p>
                    <p><strong>Phone:</strong> (555) 123-4567</p>
                    <p><strong>Address:</strong> 123 Food Street, Downtown District, City, State 12345</p>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground">
                  We will respond to your privacy-related inquiries within 30 days of receipt.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
};