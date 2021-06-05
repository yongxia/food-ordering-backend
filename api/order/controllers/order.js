const { sanitizeEntity } = require('strapi-utils');

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
};