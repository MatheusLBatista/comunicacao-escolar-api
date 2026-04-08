import PostModel from '../models/Post.js';
import PostFilterBuilder from './filters/PostFilterBuilder.js';
import { CustomError, messages } from '../utils/helpers/index.js';

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

    const school_id = req.params.schoolId;
    const {
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
      .withSchoolId(school_id || '')
      .withAuthorId(author_id || '')
      .withTitle(title || '')
      .withContent(content || '')
      .withScope(scope || '')
      .withTargetId(target_id || '')
      .withActive(active || '');

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

  async update(id, parsedData, userId) {
    if (userId) {

      const data = await this.model.findOneAndUpdate({ _id: id, author_id: userId }, parsedData, { new: true, runValidators: true })



      if (!data) {
        throw new CustomError({
          statusCode: 404,
          errorType: 'resourceNotFound',
          field: 'Announcements',
          details: [],
          customMessage: messages.error.resourceNotFound('Announcements'),
        });
      }
      return data;
    }

    const data = await this.model.findByIdAndUpdate(id, parsedData, {
      new: true,
    });


    if (!data) {
      throw new CustomError({
        statusCode: 404,
        errorType: 'resourceNotFound',
        field: 'Announcements',
        details: [],
        customMessage: messages.error.resourceNotFound('Announcements'),
      });
    }
    return data;
  }

  async getById(id) {
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

    return data;
  }

  async delete(id, userId) {
    if (userId) {
      const data = await this.model.findOneAndDelete({ _id: id, author_id: userId })
     
      console.log(data)

      if (!data) {
        throw new CustomError({
          statusCode: 404,
          errorType: 'resourceNotFound',
          field: 'Announcements',
          details: [],
          customMessage: messages.error.resourceNotFound('Announcements')
        })
      }

      return
    }

    const data = await this.model.findByIdAndDelete(id)
    if (!data) {
      throw new CustomError({
        statusCode: 404,
        errorType: 'resourceNotFound',
        field: 'Announcements',
        details: [],
        customMessage: messages.error.resourceNotFound('Announcements')
      })
    }
    return
  }
}

export default PostRepository;
