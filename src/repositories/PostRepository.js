import PostModel from '../models/Post.js';
import PostFilterBuilder from './filters/PostFilterBuilder.js'

class PostRepository {
  constructor() {
    this.model = PostModel;
  }

  async list(req) {
        const id = req?.params?.id;

    if (id) {
      const data = await this.model.findById(id);

      if (!data) {
        throw new CustomError({
          statusCode: 404,
          errorType: 'resourceNotFound',
          field: 'Announcements',
          details: [],
          customMessage: messages.error.resourceNotFound('Announcements'),
        });
      }

      return {
        ...data.toObject(),
      };
    }

    const {
      school_id,
      author_id,
      title,
      content,
      scope,
      target_id,
      active,
      page = 1,
    } = req?.query || {};

    const limit = Math.min(parseInt(req?.query?.limit, 10) || 10, 100);

    const filterBuilder = new PostFilterBuilder()
      .withSchoolId(school_id || "")
      .withAuthorId(author_id || "")
      .withTitle(title || "")
      .withContent(content || "")
      .withScope(scope || "")
      .withTargetId(target_id || "")
      .withActive(active || "");

    const filters = filterBuilder.build();

    const options = {
      page: parseInt(page, 10),
      limit,
      // sort: { name: 1 },
    };

    const result = await this.model.paginate(filters, options);

    result.docs = result.docs.map((doc) => {
      const schoolObj =
        typeof doc.toObject === 'function' ? doc.toObject() : doc;

      return {
        ...schoolObj,
      };
    });

    return result;
  }

  async create(parsedData) {
    const data = await this.model.insertOne(parsedData);
    return data;
  }
}

export default PostRepository;
