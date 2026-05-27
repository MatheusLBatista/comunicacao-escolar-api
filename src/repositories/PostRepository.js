import PostModel from '../models/Post.js';
import LikeModel from '../models/Like.js';
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

      const dataObj =
        typeof data.toObject === 'function' ? data.toObject() : data;

      try {
        const likes = await LikeModel.find({ post_id: data._id });

        const user_liked = likes.map((l) => l.user_id);
        const totalLikes = likes.length;

        return {
          ...dataObj,
          likes_count: totalLikes,
          totalLikes,
          user_liked,
        };
      } catch (error) {
        return {
          ...dataObj,
          likes_count: 0,
          totalLikes: 0,
          user_liked: [],
        };
      }
    }

    const school_id = req.params.schoolId;
    const {
      author_id,
      title,
      content,
      scope,
      target_id,
      active,
      created_at,
      page = 1,
    } = req?.query || {};

    const limit = Math.min(parseInt(req?.query?.limit, 1) || 1, 100);

    const filterBuilder = new PostFilterBuilder()
      .withSchoolId(school_id || '')
      .withAuthorId(author_id || '')
      .withTitle(title || '')
      .withContent(content || '')
      .withScope(scope || '')
      .withTargetId(target_id || '')
      .withCreatedAtBefore(created_at || '')
      .withActive(active || '');

    const filters = filterBuilder.build();

    const options = {
      page: parseInt(page, 10),
      limit,
      sort: { created_at: -1 },
    };

    const result = await this.model.paginate(filters, options);

    try {
      const docIds = result.docs.map((doc) => doc._id);

      const likes = await LikeModel.find({ post_id: { $in: docIds } });

      const likesMap = {};
      likes.forEach((like) => {
        const key = like.post_id.toString();
        if (!likesMap[key]) {
          likesMap[key] = [];
        }
        likesMap[key].push(like.user_id);
      });

      result.docs = result.docs.map((doc) => {
        const docId = doc._id?.toString();
        const user_liked = likesMap[docId] || [];
        const likes_count = user_liked.length;

        const docObj =
          typeof doc.toObject === 'function' ? doc.toObject() : doc;

        return {
          ...docObj,
          likes_count,
          user_liked,
        };
      });
    } catch (error) {
      // Se houver erro ao buscar likes, retornar sem eles
      result.docs = result.docs.map((doc) => {
        const docObj =
          typeof doc.toObject === 'function' ? doc.toObject() : doc;
        return {
          ...docObj,
          likes_count: 0,
          user_liked: [],
        };
      });
    }

    return result;
  }

  async create(parsedData) {
    const data = await this.model.insertOne(parsedData);
    return data;
  }

  async update(id, parsedData, userId) {
    if (userId) {
      const data = await this.model.findOneAndUpdate(
        { _id: id, author_id: userId },
        parsedData,
        { new: true, runValidators: true },
      );

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
      const data = await this.model.findOneAndUpdate(
        { _id: id, author_id: userId },
        { active: false },
      );

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

    const data = await this.model.findByIdAndDelete(id);
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

  async uploadFoto(id, urlMinio, idUser) {
    const filter = idUser ? { _id: id, author_id: idUser } : { _id: id };

    const data = await this.model.findOneAndUpdate(
      filter,
      { $addToSet: { attachments: urlMinio } },
      { new: true },
    );

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

  async deletaFoto(id, urlMinio, idUser) {
    const filter = idUser ? { _id: id, author_id: idUser } : { _id: id };
    const data = await this.model.findOneAndUpdate(filter, {
      $pull: { attachments: urlMinio },
    });
    return data;
  }

  async getFoto({ postId, linkId, userId } = {}) {
    if (userId) {
      const data = await this.model.findOne({ _id: postId, author_id: userId });

      if (!data) {
        return null;
      }

      return data.attachments.find((item) => item == linkId) || null;
    }

    const data = await this.model.findById(postId);

    const foto = data.attachments.find((item) => item == linkId);
    return foto;
  }
}

export default PostRepository;
