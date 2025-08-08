-- Create a table for storing banner/hero images that can be managed by admin
CREATE TABLE IF NOT EXISTS public.banner_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url TEXT,
  title TEXT,
  subtitle TEXT,
  button_text TEXT,
  button_link TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.banner_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for banner settings
CREATE POLICY "Anyone can view active banners" 
ON public.banner_settings 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage banners" 
ON public.banner_settings 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::user_role));

-- Insert a default banner
INSERT INTO public.banner_settings (title, subtitle, button_text, button_link, is_active) 
VALUES (
  'Delicious Food',
  'Experience restaurant-quality meals delivered straight to your door',
  'Order Now',
  '/menu',
  true
);

-- Add image_upload_url column to menu_items for flexible image management
ALTER TABLE public.menu_items 
ADD COLUMN IF NOT EXISTS image_upload_url TEXT;

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for banner_settings
CREATE TRIGGER update_banner_settings_updated_at
    BEFORE UPDATE ON public.banner_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();