COMPONENT('lazycontent', function(self) {

	self.visible_old = 0;
	self.isinit = false;
	self.isredraw = false;

	self.readonly();

	self.init = function() {

		window.$lazycontent = [];
		window.$lazycontent_can = false;

		var win = $(window);
		win.on('scroll', function() {

			if (!window.$lazycontent_can)
				return;

			var arr = window.$lazycontent;
			var top = win.scrollTop();
			var toph = top + win.height();

			for (var i = 0, length = arr.length; i < length; i++) {
				var item = arr[i];
				item.component.visible = toph >= item.top && top <= item.top + item.height;
				!item.remove && item.component.refresh(item);
			}
		});

		window.$lazycontent_refresh = function(skip) {
			setTimeout2('$lazycontent', function() {
				var arr = window.$lazycontent;
				for (var i = 0, length = arr.length; i < length; i++) {
					var item = arr[i];
					if (item.remove)
						continue;
					if (item.component.id !== skip)
						item.top = item.component.element.offset().top;
					if (item.innerh)
						item.height = item.component.element.height();
				}
			}, 200);
		};

		setTimeout(function() {
			win.trigger('scroll');
		}, 500);

		setInterval($lazycontent_refresh(), 1000 * 60);
	};

	self.destroy = function() {
		self.clean();
	};

	self.clean = function() {
		var index = window.$lazycontent.findIndex(function(item) {
			return item.component.id === self.id;
		});
		if (index === -1)
			return;
		window.$lazycontent.splice(index, 1);
		window.$lazycontent_can = window.$lazycontent.length > 0;
	};

	self.refresh = function(item) {

		if (self.visible_old === self.visible)
			return;

		clearTimeout(self.visible_timeout);
		self.visible_old = self.visible;
		setTimeout2(self.id, function() {

			var attr;

			if (self.visible) {
				if (self.isinit) {
					self.isredraw = true;
					attr = 'redraw';
				} else {
					self.isinit = true;
					attr = 'init';
					item.remove = item.$remove;
					setTimeout(function() {
						$lazycontent_refresh(self.id);
					}, 200);
				}
			} else if (self.isinit)
				attr = 'hide';

			if (!attr)
				return;

			var path = self.attrd(attr);
			if (!path)
				return;

			var val = self.get(path);
			if (typeof(val) === 'function')
				val.call(self, self);
			else
				self.set(attr === 'hide' ? !self.visible : self.visible);

			if (!self.isinit || !item.remove)
				return;

			self.clean();
		}, 100);
	};

	self.make = function() {
		var self = this;
		var item = {};

		item.component = self;
		item.top = self.element.offset().top;
		item.type = 0;
		item.height = (self.attrd('height') || '').replace(/px|%/g, '').parseInt();
		item.$remove = !(self.attrd('redraw') || self.attrd('hide'));
		item.remove = false;

		if (!item.height) {
			item.innerh = true;
			item.height = self.element.height();
		}

		$lazycontent.push(item);
		$lazycontent_can = true;

		setTimeout2('$lazycontent.refresh', window.$lazycontent_refresh, 200);
	};
});