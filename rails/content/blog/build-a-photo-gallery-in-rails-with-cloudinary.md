---
title: "Build a photo gallery in Rails with Cloudinary (free tier)"
description: "Notes to my future self on building a photo gallery in Rails with Cloudinary, using a single bucket for dev and prod to stay on the free tier."
publishedAt: 2025-04-08
---

## Scaffolding

```bash
rails g scaffold property name description:text
rails db:migrate
```

## Setup Cloudinary

```bash
bundle add cloudinary
```

### config/initializers/cloudinary.rb

```ruby
Cloudinary.config do |config|
  config.cloud_name = Rails.application.credentials.dig(Rails.env.to_sym, :cloudinary, :cloud_name)
  config.api_key = Rails.application.credentials.dig(Rails.env.to_sym, :cloudinary, :api_key)
  config.api_secret = Rails.application.credentials.dig(Rails.env.to_sym, :cloudinary, :api_secret)
  config.secure = true
  config.cdn_subdomain = true
end
```

```bash
EDITOR=vim rails credentials:edit
```

```yaml
development:
  cloudinary:
    cloud_name: dxe1hjkoi
    api_key: 361019726125669
    api_secret: Cn6tHfSf019278367sZoO083eOI
```

### config/storage.yml

```yaml
cloudinary:
  service: Cloudinary
  folder: <%= Rails.env %>
```

### config/environments/development.rb

```ruby
config.active_storage.service = :cloudinary
```

## Upload photos

### app/models/property.rb

```ruby
class Property < ApplicationRecord
  has_many_attached :photos
end
```

### app/views/properties/_form.html.erb

```erb
= simple_form_for @property do |f|
  = f.input :photos, as: :file, input_html: { multiple: true }
```

### app/controllers/properties_controller.rb

```ruby
def property_params
  params.require(:property).permit(:name, :description, photos: [])
end
```

## Show photos

### app/views/properties/show.html.erb

```erb
- @property.photos.each do |photo|
  = cl_image_tag photo.key, height: 500, width: 1108, crop: :fill
```

## Delete photos

### config/routes.rb

```ruby
resources :properties do
  resources :photos do
    match '/remove', to: 'properties#remove', via: 'delete'
  end
end
```

### app/controllers/properties_controller.rb

```ruby
def remove
  # We rely on the account to scope properties, but use your own logic.
  @property = current_account.properties.find(params[:property_id])
  @photo = @property.photos.find(params[:photo_id])
  @photo.purge
  redirect_to property_path(@property), notice: "Photo was successfully removed."
end
```

### app/views/properties/_form.html.slim

```slim
.card-columns.mt-3
  - @property.photos.each do |photo|
    .card
      .card-body
        = cl_image_tag photo.key, height: 200, width: 400, crop: :fill, class: 'img-fluid'
      .card-footer
        = link_to "Remove", property_photo_remove_path(@property, photo), \
          method: :delete, data: { confirm: 'Are you sure you want to delete this photo?' }, \
          class: 'btn btn-light btn-block'
```

The `<%= Rails.env %>` folder in storage.yml does all the work. One account, two environments, no extra cost.
