import Post from '../../models/Post.js';

class PostFilterBuilder {
  constructor() {
    this.filters = {};
    this.postModel = new Post();
  }

  withSchoolId(school_id) {

    if(school_id) {
        this.filters.school_id = school_id;
    }
    return this
  }

  withAuthorId(author_id) {
    if(author_id) {
        this.filters.author_id = author_id
    }
    return this
  }

  withTitle(title) {
    if(title) {
        this.filters.title = { $regex: title, $options: 'i' }
    }
    return this
  }

  withContent(content) {
    if(content) {
        this.filters.content = { $regex: content, $options: 'i'}
    }
    return this
  }

  withScope(scope) {
    if(scope) {
        this.filters = {"target.scope":{ $regex:scope, $options: 'i'}}
    }
    return this
  }


  build() {
    console.log(this.filters)
    return this.filters;
  }
}

export default PostFilterBuilder;