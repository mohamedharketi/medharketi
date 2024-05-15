from concurrent import futures
import grpc
import time
import user_pb2
import user_pb2_grpc
from pymongo import MongoClient
from bson.objectid import ObjectId

# Connect to MongoDB
client = MongoClient('mongodb+srv://mohamedharketi03:XIaMcxHNiV2KaeOE@cluster0.jr7omng.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
db = client['mydatabase']  # Specify the database name
users_collection = db['users']  # Specify the collection name

class UserService(user_pb2_grpc.UserServiceServicer):


    #get user by id
    def GetUser(self, request, context):
        user_id = request.user_id
        # Query user from MongoDB
        user_doc = users_collection.find_one({'_id': ObjectId(user_id)})
        if user_doc:
            return user_pb2.GetUserResponse(user=self.user_doc_to_proto(user_doc))
        else:
            context.set_code(grpc.StatusCode.NOT_FOUND)
            context.set_details('User not found')
            return user_pb2.GetUserResponse()

    def GetUsers(self, request, context):
        # Query all users from MongoDB
        user_docs = users_collection.find()
        return user_pb2.GetUsersResponse(users=[self.user_doc_to_proto(user_doc) for user_doc in user_docs])

    def CreateUser(self, request, context):
        name = request.name
        email = request.email
        # Create user in MongoDB
        user_doc = {'name': name, 'email': email}
        result = users_collection.insert_one(user_doc)
        user_id = str(result.inserted_id)
        return user_pb2.CreateUserResponse(user=self.user_doc_to_proto(user_doc, user_id))

    def UpdateUser(self, request, context):
        user_id = request.user_id
        name = request.name
        email = request.email
        # Update user in MongoDB
        result = users_collection.update_one({'_id': ObjectId(user_id)}, {'$set': {'name': name, 'email': email}})
        if result.modified_count > 0:
            user_doc = users_collection.find_one({'_id': ObjectId(user_id)})
            return user_pb2.UpdateUserResponse(user=self.user_doc_to_proto(user_doc))
        else:
            context.set_code(grpc.StatusCode.NOT_FOUND)
            context.set_details('User not found')
            return user_pb2.UpdateUserResponse()

    def DeleteUser(self, request, context):
        user_id = request.user_id
        # Delete user from MongoDB
        result = users_collection.delete_one({'_id': ObjectId(user_id)})
        if result.deleted_count > 0:
            return user_pb2.DeleteUserResponse(success=True)
        else:
            context.set_code(grpc.StatusCode.NOT_FOUND)
            context.set_details('User not found')
            return user_pb2.DeleteUserResponse(success=False)

    def user_doc_to_proto(self, user_doc, user_id=None):
        if user_id:
            user_doc['_id'] = user_id
        return user_pb2.User(id=user_doc['_id'], name=user_doc['name'], email=user_doc['email'])

def serve():
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    user_pb2_grpc.add_UserServiceServicer_to_server(UserService(), server)
    server.add_insecure_port('[::]:50052')
    server.start()
    print("Server started at port 50052")
    try:
        while True:
            time.sleep(86400)
    except KeyboardInterrupt:
        server.stop(0)

if __name__ == '__main__':
    serve()
