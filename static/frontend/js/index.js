$(document).ready(() => {
  const indexPage = new IndexPage();
  indexPage.registerEventHandlers();
});


class IndexPage {
  constructor() {
    this.excludePictureIndexes = [];
    this.deletablePictureIds = [];
  }

  // イベントハンドラの追加
  registerEventHandlers() {
    // 初期表示
    this.refresh();

    // 画像の追加(同じファイルを選択できるようにする)
    // https://stackoverflow.com/questions/4109276/how-to-detect-input-type-file-change-for-the-same-file
    const fileTag = $('#pictures');
    fileTag.on('click', function() {
      $(this).prop('value', '');
    })
    fileTag.on('change', (event) => {
      this.createAdditionalPicturePreviews(event);
    });

    // 画像の削除
    $('#additions, #existences').on('click', '.remove-picture', (event) => {
      this.removePicture(event);
    })

    // メモの保存
    $('#save').on('click', () => {
      this.save();
    })

    // メモの削除
    $('#delete').on('click', () => {
      this.destroy();
    })
  }

  // 追加画像のプレビューを作成
  createAdditionalPicturePreviews(event) {
    this.clearAdditionalPictures();

    for (let i = 0; i < event.target.files.length; i++) {
      const file = event.target.files[i];
      const reader = new FileReader();
      reader.onload = (onLoadEvent) => {
        if (onLoadEvent.target.result) {
          $('#additions').append(this.createPreviewHtml(
            {src: onLoadEvent.target.result, alt: file.name, additionalPictureIndex: i}));
        }
      };
      reader.readAsDataURL(file);
    }
  }

  // プレビューのHTMLを作成
  createPreviewHtml({src, alt, additionalPictureIndex = null, registeredPictureId = null}) {
    return `
    <div class="preview">
      <p>
        <img src="${src}" alt="${alt}" style="width: 20%; max-width:300px;">
        <button type="button" class="remove-picture"
                data-additional-picture-index="${additionalPictureIndex}"
                data-registered-picture-id="${registeredPictureId}">
          <i class="material-icons">delete</i>
        </button>
      </p>
    </div>`
  }

  // 新規追加・アップロード済画像の削除
  removePicture(event) {
    // プレビューを削除
    $(event.currentTarget).closest('.preview').remove();

    // 新規追加した画像を削除する場合
    const additionalIndex = $(event.currentTarget).attr('data-additional-picture-index');
    if (additionalIndex) {
      this.excludePictureIndexes.push(parseInt(additionalIndex, 10));
    }

    // アップロード済の画像を削除する場合
    const registeredId = $(event.currentTarget).attr('data-registered-picture-id');
    if (registeredId) {
      this.deletablePictureIds.push(parseInt(registeredId, 10));
    }
  }

  // 追加した画像情報をクリア
  clearAdditionalPictures() {
    $('#additions').empty();
    this.excludePictureIndexes = [];
  }

  // 全項目をクリア
  clearFields() {
    this.clearAdditionalPictures();

    $('#existences').empty();
    this.deletablePictureIds = [];

    $('#memo-id').val('');
    $('#title').val('');
    $('#content').val('');
    $('#pictures').val('');
  }

  // メモの保存
  save() {
    const api = new Api({
      memoId: $('#memo-id').val(),
      requestData: this.createRequestData(),
      csrfToken: this.getCsrfToken()
    })
    api.createOrUpdate()
      .then(
        (responseData) => this.refresh(responseData),
        () => {}  // TODO エラー処理
      )
  }

  // メモの削除
  destroy() {
    const memoId = $('#memo-id').val();
    if (!memoId) {
      return;
    }
    const api = new Api({memoId: memoId});
    api.delete()
      .then(
        () => this.refresh(),
        () => {}
      )
  }

  // メモの読み込み(なければ空白)
  refresh(memoData = null) {
    this.clearFields();
    const memoId = memoData ? memoData.id : null;
    const api = new Api({memoId: memoId});
    api.fetch()
      .then(
        (responseData) => {
          $('#memo-id').val(responseData.id);
          $('#title').val(responseData.title);
          $('#content').val(responseData.content);
          for (const picture of responseData.pictures) {
            $('#existences').append(
              this.createPreviewHtml({src: picture.file, alt: picture.name, registeredPictureId: picture.id}));
          }
        },
        () => {}  // 今回は、いずれのエラーでも画面に反映させない
      )
  }

  // APIにリクエストするデータを作成
  createRequestData() {
    const formData = new FormData();

    // ファイル以外の項目を手動でセット
    formData.append('id', $('#memo-id').val());
    formData.append('title', $('#title').val());
    formData.append('content', $('#content').val());

    // 送信が必要なファイルのみFormDataへ追加
    const files = $('#pictures').get(0).files;
    for (let i = 0; i < files.length; i++) {
      if (!this.excludePictureIndexes.includes(i)) {
        formData.append('additional_pictures', files[i]);
      }
    }

    for (const removalPictureId of this.deletablePictureIds) {
      formData.append('deletable_picture_ids', removalPictureId);
    }

    return formData;
  }

  // DjangoのCSRFトークンを取得
  getCsrfToken() {
    return document.querySelector('[name=csrfmiddlewaretoken]').value;
  }
}


class Api {
  constructor({memoId = null, requestData = null, csrfToken = null}) {
    this.memoId = memoId;
    this.requestData = requestData;
    this.csrfToken = csrfToken;

    this.BASE_URL = '/api/memo/'
  }

  // APIでデータを取得
  fetch() {
    // 今回は最新のみ表示するという仕様
    const url = this.memoId ? `${this.BASE_URL}${this.memoId}/` : `${this.BASE_URL}latest/`;
    return $.ajax({
      url: url,
      method: 'GET',
      timeout: 10000,
      dataType: 'json',
    });
  }

  // APIでデータを作成or更新
  createOrUpdate() {
    const requestParams = {
      type: this.memoId ? 'PATCH' : 'POST',
      url: this.memoId ? `${this.BASE_URL}${this.memoId}/` : this.BASE_URL,
      contentType: false,
      processData: false,
      data: this.requestData,
      beforeSend: (xhr) => {
        xhr.setRequestHeader('X-CSRFToken', this.csrfToken);
      },
    };
    return $.ajax(requestParams);
  }

  // APIでデータを削除
  delete() {
    const url = `${this.BASE_URL}${this.memoId}/`;
    return $.ajax({
      url: url,
      method: 'DELETE',
      timeout: 10000,
      dataType: 'json',
    });
  }
}
