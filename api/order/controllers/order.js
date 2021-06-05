const { sanitizeEntity } = require('strapi-utils');

const stripe = require("stripe")(process.env.STRIPE_SK);


module.exports = {
    /**
     * Retrieve records.
     *
     * @return {Array}
     */


    async find(ctx) {

        const { user } = ctx.state;

        let entities;
        if (ctx.query._q) {
            entities = await strapi.services.order.search({ ...ctx.query, users_permissions_user: user.id });
        } else {
            entities = await strapi.services.order.find({ ...ctx.query, users_permissions_user: user.id });
        }

        return entities.map(entity => sanitizeEntity(entity, { model: strapi.models.order }));
    },

    async findOne(ctx) {
        const { user } = ctx.state;
        const { id } = ctx.params;

        const entity = await strapi.services.order.findOne({ id, users_permissions_user: user.id });
        return sanitizeEntity(entity, { model: strapi.models.order });
    },

    async create(ctx) {
        const BASE_URL = ctx.request.headers.origin || 'http://localhost:3000';
        const { dishes, amount } = JSON.parse(ctx.request.body);
        const server = strapi.config.get('server');

        const line_items = dishes.map(dish => {
            let data = {
                price_data: {
                    currency: "usd",
                    product_data: {
                        name: dish.name,
                    },
                    unit_amount: Math.floor(dish.price * 100),
                },
                quantity: dish.quantity,
            }
            if (dish.image) {
                data.price_data.product_data.images = [`http://${server.host}:${server.port}${dish.image.url}`]
                console.log(data.price_data.product_data.images);
            }
            return data;
        });


        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: line_items,
            customer_email: ctx.state.user.email,
            mode: "payment",
            success_url: `${BASE_URL}/success`,
            cancel_url: `${BASE_URL}/cancel`,
        })

        const order = await strapi.services.order.create({
            user: ctx.state.user.id,
            checkout_session: session.id,
            amount: amount,
            // address,
            //  dishes,
            // city,
            //  state,
        });

        return { id: session.id }

    },
};