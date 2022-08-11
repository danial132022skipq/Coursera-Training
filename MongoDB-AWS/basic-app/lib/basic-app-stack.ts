import { Stack, StackProps } from 'aws-cdk-lib';
import {Duration} from 'aws-cdk-lib';
import * as lambda_ from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';

import * as path from 'path';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class BasicAppStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

     // create lambda functions for metric publisher and dynamodb writer
     let role = this.create_role()
     let lambda_layer = this.createLayer('lambda_layer', path.join(__dirname, '../layers'))
     let lambda_api_backend = this.createLambda("lambda_api_backend", path.join(__dirname, '../resources/api_backend'), 'api_backend.handler', role, lambda_layer);
     
     // create apigateway with proxy lambda interation
     const api = new apigateway.LambdaRestApi(this, 'DanialPasha_Movies_API', {handler: lambda_api_backend});
     
  }

  createLayer(id:string, asset:string){
    return new lambda_.LayerVersion(this, id, {code: lambda_.Code.fromAsset(asset),
                                              compatibleRuntimes: [lambda_.Runtime.NODEJS_14_X]});
  }
  
  createLambda(id:string, asset:string, handler:string, role:any, layer:any){
    return new lambda_.Function(this, id, {
                              code: lambda_.Code.fromAsset(asset),
                              runtime: lambda_.Runtime.NODEJS_14_X,
                              handler: handler,
                              timeout : Duration.minutes(5),
                              layers: [layer],
                              role: role
                              //environment : envVar,
                              });
  }

  create_role(this:any){
    const role = new iam.Role(this,"lambda_role",{assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com")});
    role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole"));
    role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName("CloudWatchFullAccess"));
    role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonS3FullAccess"));
    return role;
    }
  
  createPolicy(action:string,resource:string){
    return new iam.PolicyStatement({
    effect : iam.Effect.ALLOW,
    actions: [action],
    resources: [resource],
    })
  }


}
