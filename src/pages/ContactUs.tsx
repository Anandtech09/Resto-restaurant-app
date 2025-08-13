import { useState } from 'react';
import { MapPin, Phone, Mail, Clock, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export const ContactUs = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    setTimeout(() => {
      toast({
        title: "Message Sent!",
        description: "Thank you for contacting us. We'll get back to you within 24 hours.",
      });
      
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
      });
      setIsSubmitting(false);
    }, 1000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="gradient-hero text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold text-coffee mb-6">Contact Us</h1>
            <p className="text-xl md:text-2xl text-gold">
              We'd love to hear from you. Get in touch with our team!
            </p>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Information */}
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl font-bold mb-6">Get in Touch</h2>
              <p className="text-muted-foreground text-lg">
                Have a question, feedback, or need assistance? We're here to help! 
                Reach out to us through any of the methods below, and we'll respond as quickly as possible.
              </p>
            </div>

            <div className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 gradient-warm rounded-full flex items-center justify-center flex-shrink-0">
                      <MapPin className="h-6 w-6 text-coffee" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Our Location</h3>
                      <p className="text-muted-foreground">
                        123 Food Street<br />
                        Downtown District<br />
                        City, State 12345
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 gradient-warm rounded-full flex items-center justify-center flex-shrink-0">
                      <Phone className="h-6 w-6 text-coffee" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Phone Number</h3>
                      <p className="text-muted-foreground">
                        Main: (555) 123-4567<br />
                        Orders: (555) 123-FOOD<br />
                        Support: (555) 123-HELP
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 gradient-warm rounded-full flex items-center justify-center flex-shrink-0">
                      <Mail className="h-6 w-6 text-coffee" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Email Address</h3>
                      <p className="text-muted-foreground">
                        General: info@restaurant.com<br />
                        Support: support@restaurant.com<br />
                        Orders: orders@restaurant.com
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 gradient-warm rounded-full flex items-center justify-center flex-shrink-0">
                      <Clock className="h-6 w-6 text-coffee" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Business Hours</h3>
                      <div className="text-muted-foreground space-y-1">
                        <p>Monday - Thursday: 11:00 AM - 10:00 PM</p>
                        <p>Friday - Saturday: 11:00 AM - 11:00 PM</p>
                        <p>Sunday: 12:00 PM - 9:00 PM</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Contact Form */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Send us a Message
                </CardTitle>
                <CardDescription>
                  Fill out the form below and we'll get back to you within 24 hours.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Enter your full name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Enter your email"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="(555) 123-4567"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject</Label>
                      <Input
                        id="subject"
                        name="subject"
                        type="text"
                        value={formData.subject}
                        onChange={handleChange}
                        placeholder="What's this about?"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Tell us how we can help you..."
                      rows={6}
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    className="btn-food w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Sending Message...' : 'Send Message'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* FAQ Section */}
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>Frequently Asked Questions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">What are your delivery areas?</h4>
                    <p className="text-sm text-muted-foreground">
                      We deliver within a 10-mile radius of our restaurant. Enter your address during checkout to confirm delivery availability.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">How long does delivery take?</h4>
                    <p className="text-sm text-muted-foreground">
                      Our average delivery time is 30-45 minutes, depending on your location and current order volume.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Do you accommodate dietary restrictions?</h4>
                    <p className="text-sm text-muted-foreground">
                      Yes! We offer vegetarian, vegan, and gluten-free options. Check our menu for specific dietary information or contact us for custom requests.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">What payment methods do you accept?</h4>
                    <p className="text-sm text-muted-foreground">
                      We accept all major credit cards, debit cards, and cash on delivery.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};