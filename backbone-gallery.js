
// make sure we have a dispatcher available
if (_.isUndefined(window.dispatcher)) {
  window.dispatcher = {};
  _.extend(window.dispatcher, Backbone.Events);
}

window.Album = Backbone.Model.extend({
  defaults: {
    title: '',
    description: ''
}});

window.Photo = Backbone.Model.extend({
  defaults: {
    filename: '',
    title: '',
    description: '',
    state: ''
  },
  select: function(state){
    this.set({'state': state ? 'selected' : ''});
  }
});


window.Albums = Backbone.Collection.extend({
  model: Album
});



window.Photos = Backbone.Collection.extend({
  model: Photo,

  select: function(model){
    if( this.selectedThumb() ){
      this.selectedThumb().select(false);
    }

    this.selected = model;
    this.selected.select(true);

  },

  selectedThumb: function(){
    return this.selected;
  }
});




window.FullView = Backbone.View.extend({
  template: _.template($('#fullsize-template').html()),

  initialize: function(){
    _.bindAll(this);
    dispatcher.on('thumb:selected', this.selectPhoto);
  },

  selectPhoto: function(photo){
    this.model = photo;
    this.render();
    console.log(photo);
  },

  render: function(){
    this.$el.html(this.template(this.model.toJSON()));
  }

});


window.ThumbView = Backbone.View.extend({
  tagName: 'li',
  template: _.template('<img src="<%= thumb_path %>" class="<%= state %>" />'),
  events: {
    "click" : "selectThumb"
  },
  initialize: function(options){
    _.bindAll(this);
  },

  render: function(){
    this.$el.html(this.template(this.model.toJSON()));
    return this;
  },

  selectThumb: function(){
    dispatcher.trigger('thumb:selected', this.model);
  }
});

window.GalleryRouter = Backbone.Router.extend({
  routes: {
    "album/:slug":                 "loadAlbum",    // #album/lucas
    "*path": "index"
  },

  initialize: function(options) {
    this.gallery = options.gallery;
  },

  loadAlbum: function(slug) {
    album = this.gallery.albums.where({slug: slug})[0];
    this.gallery.setAlbum(album.id);

  },

  index: function() {
    album = this.gallery.albums.get(1);
    this.navigate('/album/' + album.get('slug'), trigger=true);
  }
});

window.GalleryView = Backbone.View.extend({
  el: $("#gallery"),

  initialize: function(options) {
    _.bindAll(this);

    // this.album = new Album();
    dispatcher.on("album:change", this.update);

    this.gallery = this.options.gallery;

    this.albums = new Albums();


    this.info = this.$('#info');
    this.info_template = _.template($('#gallery-info-template').html());

    this.thumbs = this.$el.find('#thumbs');
    this.fullsize = new FullView({ el: this.$('#fullsize') });

    this.load();


    this.router = new GalleryRouter({ gallery: this });

    Backbone.history.start();

    },

    load: function() {
    // lets load all the albums and photos

    self = this;
    album_id = 1;
    // load each album
    _.each(this.gallery.albums, function(_album){

      album = new Album({
        id: album_id,
        title: _album.title,
        description: _album.description,
        directory: self.gallery.base_dir + _album.slug + '/',
        slug: _album.slug
      });

      console.log(self.gallery.base_dir + album.get('slug'));

      // load photos into Photos collection
      album.photos = new Photos();
      photo_id = 1;
      _.each(_album.photos, function(_photo) {
        _photo.full_path = album.get('directory') + _photo.filename;
        _photo.thumb_path =  album.get('directory') + 'thumbs/' + _photo.filename;
        _photo.id = photo_id;
        photo = new Photo(_photo);
        album.photos.add(photo);
        photo_id += 1;
      });

      // add album to albums collection
      self.albums.add(album);
      album_id += 1;
    });




    // dispatcher.trigger('thumb:selected', this.collection.get(1));

  },

  render: function(){
    return this.el;
  },

  setAlbum: function(id) {
    this.album = this.albums.get(id);
    dispatcher.trigger('album:change', this.album);
  },

  update: function() {
    this.info.html(this.info_template({
      title: this.album.get('title'),
      description: this.album.get('description')
    }));

    $(this.thumbs).find('li').remove().end();

    this.album.photos.each(function(photo) {
      $(this.thumbs).append( new ThumbView({
        model: photo }).render().el);
    });


    this.fullsize.selectPhoto(this.album.photos.get(1));


  }
});



gallery = {
    base_dir:  '/media/photos/',
    albums: [
      { title: 'Lucas',
        slug: 'lucas',
        description: 'My baby boy.  Almost a year old.',
        photos: [
          { filename: 'IMG_4423.jpg', title: 'Oh hai!' },
          { filename: 'IMG_4433.jpg', title: 'Friends' },
          { filename: 'IMG_4505.jpg', title: 'Sleeping with Sock Monkey' },
          { filename: 'IMG_4369.jpg', title: 'Weeeeee' },
          { filename: 'IMG_4333.jpg', title: 'First burrito' }
        ]
      },
      { title: 'House',
        slug: 'house',
        description: 'Some pictures of our small ranch.',
        photos: [
          { filename: 'IMG_4387.jpg', title: 'We got new windows' },
          { filename: 'IMG_4391.jpg', title: 'New Bay Window' },
          { filename: 'IMG_4393.jpg', title: 'Garden post tree felling' },
          { filename: 'IMG_4397.jpg', title: 'Hose station' }
        ]

    }
    ]
  };



window.Gallery =  new GalleryView({ gallery: gallery});
