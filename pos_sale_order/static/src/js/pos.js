function pos_website_sale(instance, module){ //module is instance.point_of_sale

    //TODO update WebsiteOrderWidget on change currentOrder
    module.WebsiteOrderWidget = module.PosBaseWidget.extend({
        template:'WebsiteOrderWidget',
        init:function(parent, options){
            this._super(parent);
            this.numpad_state = this.pos_widget.numpad.state;
            this.order_name = false;
        },
        find_sale_order: function(name_like){
            return new instance.web.Model('sale.order')
                .query(['partner_id', 'amount_total', 'name'])
                .filter([
                    ['name','=like',name_like],
                    ['payment_ids', '=', false],
                    ['procurement_group_id', '=', false],
                    ['state', '!=', 'cancel']])
                .all()
        },
        load_sale_order_lines: function(id){
            return new instance.web.Model('sale.order.line').query(['product_id', 'product_uom_qty','discount']).filter([['order_id','=',id]]).all();
        },
        apply_sale_order: function(id, partner_id){
            var self = this;
            self.load_sale_order_lines(id)
            .then(function(lines){
                var order = self.pos.get('selectedOrder');
                $.each(lines, function(k, item){
                    var product = self.pos.db.get_product_by_id(item.product_id[0]);
                    var options = {
                        'quantity':item.product_uom_qty
                    };
                    order.addProduct(product, options);
                    if (item.discount)
                        order.getSelectedLine().set_discount(item.discount);
                    var partner = self.pos.db.get_partner_by_id(partner_id);
                    order.set_client(partner || undefined);
                    order.sale_order_id = id;
                    order.set('sale_order_id', id);
                });
                self.hide();
            });
        },
        start:function(){
            this._super();
            var self = this;

            this.enable_numpad();
            $('.website_order button').click(function(){
                self.find_sale_order('%'+self.order_name+'%').then(function(orders){
                    if (orders.length > 1){
                        //TODO Allow to select a order from the list
                        list = '';
                        for (var i = 0, len = orders.length; i < len; i++){
                            list += orders[i].name + ", ";
                        }
                        self.pos_widget.screen_selector.show_popup('error', {
                            'message': _t('Multiple matching'),
                            'comment': _t("Several orders found for '" +
                                          self.order_name + "': " + list),
                        });
                    } else if (!orders[0]){
                        self.pos_widget.screen_selector.show_popup('error', {
                            'message': _t('Order not found'),
                            'comment': _t("No order found for '" +
                                          self.order_name + "'."),
                        });
                        return;
                    } else {
                        var sale_order = orders[0]
                        self.apply_sale_order(
                            sale_order.id,
                            sale_order.partner_id[0])
                    }
                });
            });
        },
        set_value:function(val){
            var order = this.pos.get('selectedOrder');
            if (order.get('orderLines').length || val == 'remove'){
                this.hide();
                return;
            }
            this.show();
            this.order_name = val;
            $('.website_order button').html('Download order '+'*'+val+'*');
        },
        enable_numpad: function(){
            //this.disable_numpad();  //ensure we don't register the callbacks twice
            //this.numpad_state = this.pos_widget.numpad.state;
            if(this.numpad_state){
                //this.numpad_state.reset();
                //this.numpad_state.changeMode('payment');
                this.numpad_state.bind('set_value',   this.set_value, this);
                //this.numpad_state.bind('change:mode', this.set_mode_back_to_payment, this);
            }

        },
        disable_numpad: function(){
            if(this.numpad_state){
                this.numpad_state.unbind('set_value',  this.set_value);
                //this.numpad_state.unbind('change:mode',this.set_mode_back_to_payment);
            }
        },
    });

    module.PosWidget.include({
        template: 'PosWidget',
        build_widgets:function(){
            this._super();

            this.website_order = new module.WebsiteOrderWidget(this);
            this.website_order.replace('.placeholder-WebsiteOrderWidget');
        }
    });

    module.PaymentScreenWidget = module.PaymentScreenWidget.extend({
        validate_order: function (options) {
            var SaleOrderModel = new instance.web.Model('sale.order');
            selectedOrder = this.pos.get('selectedOrder');
            if (selectedOrder.sale_order_id){
                SaleOrderModel.call('action_cancel', [selectedOrder.sale_order_id]);
            }
            this._super(options);
        },
    });

    var OrderSuper = module.Order;
    module.Order = module.Order.extend({
        export_as_JSON: function() {
            var json = OrderSuper.prototype.export_as_JSON.apply(this,arguments);
            json.sale_order_id = this.sale_order_id;
            return json;
        },
    });
}

(function(){
    var _super = window.openerp.point_of_sale;
    window.openerp.point_of_sale = function(instance){
        _super(instance);
        var module = instance.point_of_sale;
        pos_website_sale(instance, module);
    };
})();

$('<link rel="stylesheet" href="/pos_sale_order/static/src/css/pos.css"></link>').appendTo($("head"));