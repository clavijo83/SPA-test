// COGNITO PRODUCTION USER POOL
declare const awsmobile: Record<string, any> = {
  aws_project_region: 'us-east-1',
  aws_cognito_region: 'us-east-1',
  aws_user_pools_id: '*********',
  aws_user_pools_web_client_id: '*********',
};

// COGNITO DEVELOPMENT
// declare const awsmobile: Record<string, any> = {
//   aws_project_region: 'us-east-1',
//   aws_cognito_region: 'us-east-1',
//   aws_user_pools_id: '*********',
//   aws_user_pools_web_client_id: '*********',
// };

export default awsmobile;
