# Phase 08 Error Analysis

- totalRoutes: 18
- generatedAt: 2026-05-09T12:52:49.165Z

## 1. DELETE /api/v1/article/:id
- Controller: unknown
- Final HTTP Status: 404
- Classification: Not Found/Data Missing
- Error (raw): {"status":"fail","error":{"statusCode":404,"status":"fail","isOperational":true},"message":"Article not found or you do not have permission","stack":"Error: Article not found or you do not have permission\n    at deleteArticle (E:\\easesmith\\medico\\medico_backend\\controller\\articleController.js:534:19)\n    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)"}
- Error (normalized): Article not found or you do not have permission
- Root-cause hypothesis: Requested entity/resource ID was not found in DB for this route.
- Repro request shape: DELETE /api/v1/article/699da06d063f7bf10e8ab446 using context=doctor
- Fix recommendation: Use existing IDs from DB fixtures or improve not-found handling/test data seeding.
- Priority: P3
- Confidence: High

## 2. DELETE /api/v1/socialPost/posts/:id
- Controller: controller/socialmediaController.js#deletePost
- Final HTTP Status: 404
- Classification: Confirmed Backend Bug
- Error (raw): {"success":false,"message":"Post not found"}
- Error (normalized): Post not found
- Root-cause hypothesis: Unhandled backend runtime failure in controller/middleware path.
- Repro request shape: DELETE /api/v1/socialPost/posts/699da06d063f7bf10e8ab446 using context=doctor
- Fix recommendation: Add targeted logging/guards in controller branch and cover route with regression test.
- Priority: P1
- Confidence: Medium

## 3. GET /api/v1/article/getArticleById/:id
- Controller: unknown
- Final HTTP Status: 404
- Classification: Not Found/Data Missing
- Error (raw): {"status":"fail","error":{"statusCode":404,"status":"fail","isOperational":true},"message":"Article not found","stack":"Error: Article not found\n    at getArticleById (E:\\easesmith\\medico\\medico_backend\\controller\\articleController.js:463:19)\n    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)"}
- Error (normalized): Article not found
- Root-cause hypothesis: Requested entity/resource ID was not found in DB for this route.
- Repro request shape: GET /api/v1/article/getArticleById/699da06d063f7bf10e8ab446 using context=public
- Fix recommendation: Use existing IDs from DB fixtures or improve not-found handling/test data seeding.
- Priority: P3
- Confidence: High

## 4. GET /api/v1/socialPost/feed
- Controller: controller/socialmediaController.js#getSocialFeed
- Final HTTP Status: 500
- Classification: Confirmed Backend Bug
- Error (raw): {"status":"error","error":{"statusCode":500,"status":"error"},"message":"Social is not defined","stack":"ReferenceError: Social is not defined\n    at exports.getSocialFeed (E:\\easesmith\\medico\\medico_backend\\controller\\socialmediaController.js:1861:21)\n    at Layer.handleRequest (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\layer.js:152:17)\n    at next (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\route.js:157:13)\n    at Route.dispatch (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\route.js:117:3)\n    at handle (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\index.js:435:11)\n    at Layer.handleRequest (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\layer.js:152:17)\n    at E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\index.js:295:15\n    at processParams (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\index.js:582:12)\n    at next (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\index.js:291:5)\n    at Function.handle (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\index.js:186:3)"}
- Error (normalized): Social is not defined
- Root-cause hypothesis: Missing variable/model import referenced in controller at runtime.
- Repro request shape: GET /api/v1/socialPost/feed using context=doctor
- Fix recommendation: Import the missing symbol in controller and add a startup/unit guard test.
- Priority: P0
- Confidence: High

## 5. GET /api/v1/socialPost/follow-stats/me
- Controller: controller/socialmediaController.js#getMyFollowStats
- Final HTTP Status: 200
- Classification: Confirmed Backend Bug
- Error (raw): {"success":true,"data":{"followersCount":3,"followingCount":1,"followers":[],"following":[]}}
- Error (normalized): {"success":true,"data":{"followersCount":3,"followingCount":1,"followers":[],"following":[]}}
- Root-cause hypothesis: Unhandled backend runtime failure in controller/middleware path.
- Repro request shape: GET /api/v1/socialPost/follow-stats/me using context=doctor
- Fix recommendation: Add targeted logging/guards in controller branch and cover route with regression test.
- Priority: P1
- Confidence: Medium

## 6. GET /api/v1/socialPost/getPostByAdmin/:id
- Controller: controller/socialmediaController.js#getPostByIdByAdmin
- Final HTTP Status: 404
- Classification: Confirmed Backend Bug
- Error (raw): {"message":"Post not found"}
- Error (normalized): Post not found
- Root-cause hypothesis: Unhandled backend runtime failure in controller/middleware path.
- Repro request shape: GET /api/v1/socialPost/getPostByAdmin/699da06d063f7bf10e8ab446 using context=admin
- Fix recommendation: Add targeted logging/guards in controller branch and cover route with regression test.
- Priority: P1
- Confidence: Medium

## 7. GET /api/v1/socialPost/getPostById/:id
- Controller: controller/socialmediaController.js#getPostById
- Final HTTP Status: 404
- Classification: Confirmed Backend Bug
- Error (raw): {"message":"Post not found"}
- Error (normalized): Post not found
- Root-cause hypothesis: Unhandled backend runtime failure in controller/middleware path.
- Repro request shape: GET /api/v1/socialPost/getPostById/699da06d063f7bf10e8ab446 using context=doctor
- Fix recommendation: Add targeted logging/guards in controller branch and cover route with regression test.
- Priority: P1
- Confidence: Medium

## 8. GET /api/v1/socialPost/getPosts
- Controller: controller/socialmediaController.js#getPosts
- Final HTTP Status: 200
- Classification: Confirmed Backend Bug
- Error (raw): [{"stats":{"views":0,"likes":0,"comments":0,"saves":0,"shares":0,"followers":0},"_id":"69ff2d47722a1ce380a958a4","doctor":{"address":"123, ABC Street, City, Country","_id":"69083c7093634916321ed31d","firstName":"Ravi Prakash","profilePhoto":null,"specialization":"Cardiologist, Medicine Expert, Dermatologist","clinics":[],"cities":[{"_id":"690c456658dd2334d7cb9581","name":"kanpur"}]},"type":"TEXT","content":"","mediaUrls":[],"hashtags":[],"mentions":[],"city":"690c456658dd2334d7cb9581","isHidden":false,"hiddenAt":null,"hiddenBy":null,"likes":[],"comments":[],"follows":[],"createdAt":"2026-05-09T12:49:11.325Z","updatedAt":"2026-05-09T12:49:11.325Z","__v":0,"creator":{"_id":"69083c7093634916321ed31d","name":"Ravi Prakash","location":"kanpur","position":"Cardiologist, Medicine Expert, Dermatologist","profilePhoto":null,"role":"doctor"},"isLiked":false,"isFollowed":false},{"stats":{"views":0,"likes":2,"comments":4,"saves":0,"shares":0,"followers":2},"_id":"694e3a86fd9c7089b1bd29bc","doctor":{"address":"123, ABC Street, City, Country","_id":"69083c7093634916321ed31d","firstName":"Ravi Prakash","profilePhoto":null,"specialization":"Cardiologist, Medicine Expert, Dermatologist","clinics":[...
- Error (normalized): [{"stats":{"views":0,"likes":0,"comments":0,"saves":0,"shares":0,"followers":0},"_id":"69ff2d47722a1ce380a958a4","doctor":{"address":"123, ABC Street, City, Country","_id":"69083c7093634916321ed31d","firstName":"Ravi Prakash","profilePhoto":null,"specialization":"Cardiologist, Medicine Expert, Dermatologist","clinics":[],"cities":[{"_id":"690c456658dd2334d7cb9581","name":"kanpur"}]},"type":"TEXT","content":"","mediaUrls":[],"hashtags":[],"mentions":[],"city":"690c456658dd2334d7cb9581","isHidden":false,"hiddenAt":null,"hiddenBy":null,"likes":[],"comments":[],"follows":[],"createdAt":"2026-05-09T12:49:11.325Z","updatedAt":"2026-05-09T12:49:11.325Z","__v":0,"creator":{"_id":"69083c7093634916321ed31d","name":"Ravi Prakash","location":"kanpur","position":"Cardiologist, Medicine Expert, Dermatologist","profilePhoto":null,"role":"doctor"},"isLiked":false,"isFollowed":false},{"stats":{"views":0,"likes":2,"comments":4,"saves":0,"shares":0,"followers":2},"_id":"694e3a86fd9c7089b1bd29bc","doctor":{"address":"123, ABC Street, City, Country","_id":"69083c7093634916321ed31d","firstName":"Ravi Prakash","profilePhoto":null,"specialization":"Cardiologist, Medicine Expert, Dermatologist","clinics":[...
- Root-cause hypothesis: Unhandled backend runtime failure in controller/middleware path.
- Repro request shape: GET /api/v1/socialPost/getPosts using context=doctor
- Fix recommendation: Add targeted logging/guards in controller branch and cover route with regression test.
- Priority: P1
- Confidence: Medium

## 9. GET /api/v1/socialPost/search
- Controller: controller/socialmediaController.js#searchSocialPosts
- Final HTTP Status: 200
- Classification: Confirmed Backend Bug
- Error (raw): {"success":true,"data":{"doctors":{"data":[{"_id":"69083c7093634916321ed31d","firstName":"Ravi Prakash","email":"ravi@hospital.com","phone":"8707807722","profilePhoto":null,"specialization":"Cardiologist, Medicine Expert, Dermatologist","currentWorkplace":"Metro Noida UP","designation":"Senior Consultant","professionalBio":"Experienced cardiologist with 12 years of practice","consultationFees":1000,"averageRating":0,"cities":[{"_id":"690c456658dd2334d7cb9581","name":"kanpur"}]},{"_id":"69104ae53f18864f8d196806","firstName":"hitesh","email":"katariyahiteshkumar@gmail.com","phone":"6353231475","profilePhoto":null,"cities":[],"specialization":"mbbs","currentWorkplace":"jamnagar","designation":"Senior Consultant","professionalBio":"hy","consultationFees":500,"averageRating":0},{"_id":"6984506e772be643087318b0","firstName":"Dr. mansi","email":"dr.yadavmansi@hospital.com","phone":"6388966722","profilePhoto":null,"cities":[{"_id":"690c3adf6ac52e0495f62859","name":"lucknow"}],"specialization":"Cardiology","currentWorkplace":"Apollo Hospital Delhi","designation":"Senior Consultant","professionalBio":"Experienced cardiologist with 12 years of practice","consultationFees":500,"averageRating":...
- Error (normalized): {"success":true,"data":{"doctors":{"data":[{"_id":"69083c7093634916321ed31d","firstName":"Ravi Prakash","email":"ravi@hospital.com","phone":"8707807722","profilePhoto":null,"specialization":"Cardiologist, Medicine Expert, Dermatologist","currentWorkplace":"Metro Noida UP","designation":"Senior Consultant","professionalBio":"Experienced cardiologist with 12 years of practice","consultationFees":1000,"averageRating":0,"cities":[{"_id":"690c456658dd2334d7cb9581","name":"kanpur"}]},{"_id":"69104ae53f18864f8d196806","firstName":"hitesh","email":"katariyahiteshkumar@gmail.com","phone":"6353231475","profilePhoto":null,"cities":[],"specialization":"mbbs","currentWorkplace":"jamnagar","designation":"Senior Consultant","professionalBio":"hy","consultationFees":500,"averageRating":0},{"_id":"6984506e772be643087318b0","firstName":"Dr. mansi","email":"dr.yadavmansi@hospital.com","phone":"6388966722","profilePhoto":null,"cities":[{"_id":"690c3adf6ac52e0495f62859","name":"lucknow"}],"specialization":"Cardiology","currentWorkplace":"Apollo Hospital Delhi","designation":"Senior Consultant","professionalBio":"Experienced cardiologist with 12 years of practice","consultationFees":500,"averageRating":...
- Root-cause hypothesis: Unhandled backend runtime failure in controller/middleware path.
- Repro request shape: GET /api/v1/socialPost/search?query=test using context=doctor
- Fix recommendation: Add targeted logging/guards in controller branch and cover route with regression test.
- Priority: P1
- Confidence: Medium

## 10. PATCH /api/v1/article/:id/publish
- Controller: unknown
- Final HTTP Status: 404
- Classification: Not Found/Data Missing
- Error (raw): {"status":"fail","error":{"statusCode":404,"status":"fail","isOperational":true},"message":"Article not found or you do not have permission","stack":"Error: Article not found or you do not have permission\n    at publishArticle (E:\\easesmith\\medico\\medico_backend\\controller\\articleController.js:569:19)\n    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)"}
- Error (normalized): Article not found or you do not have permission
- Root-cause hypothesis: Requested entity/resource ID was not found in DB for this route.
- Repro request shape: PATCH /api/v1/article/699da06d063f7bf10e8ab446/publish using context=doctor
- Fix recommendation: Use existing IDs from DB fixtures or improve not-found handling/test data seeding.
- Priority: P3
- Confidence: High

## 11. PATCH /api/v1/socialPost/posts/:id/hide
- Controller: controller/socialmediaController.js#toggleHidePost
- Final HTTP Status: 404
- Classification: Confirmed Backend Bug
- Error (raw): {"success":false,"message":"Post not found"}
- Error (normalized): Post not found
- Root-cause hypothesis: Unhandled backend runtime failure in controller/middleware path.
- Repro request shape: PATCH /api/v1/socialPost/posts/699da06d063f7bf10e8ab446/hide using context=admin
- Fix recommendation: Add targeted logging/guards in controller branch and cover route with regression test.
- Priority: P1
- Confidence: Medium

## 12. POST /api/v1/article/create
- Controller: unknown
- Final HTTP Status: 400
- Classification: Validation/Contract Failure
- Error (raw): {"status":"fail","error":{"statusCode":400,"status":"fail","isOperational":true},"message":"cityName, category, title, and articleType are required","stack":"Error: cityName, category, title, and articleType are required\n    at createArticle (E:\\easesmith\\medico\\medico_backend\\controller\\articleController.js:181:19)\n    at Layer.handleRequest (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\layer.js:152:17)\n    at next (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\route.js:157:13)\n    at uploadMiddleware (E:\\easesmith\\medico\\medico_backend\\route\\articleRoute.js:27:5)\n    at Layer.handleRequest (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\layer.js:152:17)\n    at next (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\route.js:157:13)\n    at authorizeAndContinue (E:\\easesmith\\medico\\medico_backend\\middleware\\auth.js:615:3)\n    at E:\\easesmith\\medico\\medico_backend\\middleware\\auth.js:295:20\n    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)"}
- Error (normalized): cityName, category, title, and articleType are required
- Root-cause hypothesis: Controller input validation rejected missing/invalid request fields for this payload.
- Repro request shape: POST /api/v1/article/create using context=doctor
- Fix recommendation: Document required fields clearly and send complete payload; relax validation only if API contract requires it.
- Priority: P3
- Confidence: High

## 13. POST /api/v1/socialPost/addComment/:id
- Controller: controller/socialmediaController.js#addComment
- Final HTTP Status: 400
- Classification: Confirmed Backend Bug
- Error (raw): {"success":false,"message":"Comment text required"}
- Error (normalized): Comment text required
- Root-cause hypothesis: Unhandled backend runtime failure in controller/middleware path.
- Repro request shape: POST /api/v1/socialPost/addComment/699da06d063f7bf10e8ab446 using context=doctor
- Fix recommendation: Add targeted logging/guards in controller branch and cover route with regression test.
- Priority: P1
- Confidence: Medium

## 14. POST /api/v1/socialPost/commentPost/:id
- Controller: controller/socialmediaController.js#addComment
- Final HTTP Status: 400
- Classification: Confirmed Backend Bug
- Error (raw): {"success":false,"message":"Comment text required"}
- Error (normalized): Comment text required
- Root-cause hypothesis: Unhandled backend runtime failure in controller/middleware path.
- Repro request shape: POST /api/v1/socialPost/commentPost/699da06d063f7bf10e8ab446 using context=doctor
- Fix recommendation: Add targeted logging/guards in controller branch and cover route with regression test.
- Priority: P1
- Confidence: Medium

## 15. POST /api/v1/socialPost/createPost
- Controller: unknown
- Final HTTP Status: 201
- Classification: Confirmed Backend Bug
- Error (raw): {"success":true,"data":{"_id":"69ff2d47722a1ce380a958a4","doctor":"69083c7093634916321ed31d","city":"690c456658dd2334d7cb9581","type":"TEXT","content":"","mediaUrls":[],"hashtags":[],"mentions":[],"isHidden":false,"createdAt":"2026-05-09T12:49:11.325Z","creator":{"_id":"69083c7093634916321ed31d","name":"Ravi Prakash","location":"City","position":"Specialist","profilePhoto":null,"role":"doctor","cities":["690c456658dd2334d7cb9581"]}}}
- Error (normalized): {"success":true,"data":{"_id":"69ff2d47722a1ce380a958a4","doctor":"69083c7093634916321ed31d","city":"690c456658dd2334d7cb9581","type":"TEXT","content":"","mediaUrls":[],"hashtags":[],"mentions":[],"isHidden":false,"createdAt":"2026-05-09T12:49:11.325Z","creator":{"_id":"69083c7093634916321ed31d","name":"Ravi Prakash","location":"City","position":"Specialist","profilePhoto":null,"role":"doctor","cities":["690c456658dd2334d7cb9581"]}}}
- Root-cause hypothesis: Unhandled backend runtime failure in controller/middleware path.
- Repro request shape: POST /api/v1/socialPost/createPost using context=doctor
- Fix recommendation: Add targeted logging/guards in controller branch and cover route with regression test.
- Priority: P1
- Confidence: Medium

## 16. POST /api/v1/socialPost/followDoctor
- Controller: controller/socialmediaController.js#toggleFollowDoctor
- Final HTTP Status: 400
- Classification: Confirmed Backend Bug
- Error (raw): {"success":false,"message":"targetDoctorId required"}
- Error (normalized): targetDoctorId required
- Root-cause hypothesis: Unhandled backend runtime failure in controller/middleware path.
- Repro request shape: POST /api/v1/socialPost/followDoctor using context=doctor
- Fix recommendation: Add targeted logging/guards in controller branch and cover route with regression test.
- Priority: P1
- Confidence: Medium

## 17. POST /api/v1/socialPost/likePost/:id/toggle
- Controller: controller/socialmediaController.js#toggleLikePost
- Final HTTP Status: 404
- Classification: Confirmed Backend Bug
- Error (raw): {"success":false,"message":"Post not found"}
- Error (normalized): Post not found
- Root-cause hypothesis: Unhandled backend runtime failure in controller/middleware path.
- Repro request shape: POST /api/v1/socialPost/likePost/699da06d063f7bf10e8ab446/toggle using context=doctor
- Fix recommendation: Add targeted logging/guards in controller branch and cover route with regression test.
- Priority: P1
- Confidence: Medium

## 18. PUT /api/v1/article/updateArticle/:id
- Controller: unknown
- Final HTTP Status: 404
- Classification: Not Found/Data Missing
- Error (raw): {"status":"fail","error":{"statusCode":404,"status":"fail","isOperational":true},"message":"Article not found or you do not have permission","stack":"Error: Article not found or you do not have permission\n    at updateArticle (E:\\easesmith\\medico\\medico_backend\\controller\\articleController.js:504:19)\n    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)"}
- Error (normalized): Article not found or you do not have permission
- Root-cause hypothesis: Requested entity/resource ID was not found in DB for this route.
- Repro request shape: PUT /api/v1/article/updateArticle/699da06d063f7bf10e8ab446 using context=doctor
- Fix recommendation: Use existing IDs from DB fixtures or improve not-found handling/test data seeding.
- Priority: P3
- Confidence: High
