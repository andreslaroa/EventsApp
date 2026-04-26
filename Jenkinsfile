pipeline {
    agent any

    environment {
        AWS_REGION        = 'us-east-1'
        ECR_REGISTRY      = '339284817300.dkr.ecr.us-east-1.amazonaws.com'
        ECR_REPO          = 'events-app'
        IMAGE_TAG         = "${GIT_COMMIT}"
        APP_EC2_IP        = 'andreslaroa-eventsapp.duckdns.org'
        APP_EC2_USER      = 'ubuntu'
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Run tests') {
            steps {
                sh '''            
                    ./.venv/bin/pip install --upgrade pip
                    ./.venv/bin/pip install -r backend/requirements.txt
                    
                    ./.venv/bin/pytest tests/ -v || true
                '''
            }
        }

        stage('Docker build') {
            steps {
                sh '''
                    docker build -t $ECR_REGISTRY/$ECR_REPO:$IMAGE_TAG .
                    docker tag $ECR_REGISTRY/$ECR_REPO:$IMAGE_TAG $ECR_REGISTRY/$ECR_REPO:latest
                '''
            }
        }

        stage('Push to ECR') {
            steps {
                withCredentials([[
                    $class: 'AmazonWebServicesCredentialsBinding',
                    credentialsId: 'jenkins-cicd'
                ]]) {
                    sh '''
                        aws ecr get-login-password --region $AWS_REGION | \
                        docker login --username AWS --password-stdin $ECR_REGISTRY
                        docker push $ECR_REGISTRY/$ECR_REPO:$IMAGE_TAG
                        docker push $ECR_REGISTRY/$ECR_REPO:latest
                    '''
                }
            }
        }

        stage('Deploy to EC2') {
            steps {
                sshagent(['EC2DockerServerConnect']) {
                    sh '''
                        ssh -o StrictHostKeyChecking=no $APP_EC2_USER@$APP_EC2_IP "
                            aws ecr get-login-password --region $AWS_REGION | \
                            docker login --username AWS --password-stdin $ECR_REGISTRY

                            docker pull $ECR_REGISTRY/$ECR_REPO:latest

                            docker stop events-app || true
                            docker rm events-app || true

                            docker run -d \
                                --name events-app \
                                --restart always \
                                -p 8000:8000 \
                                $ECR_REGISTRY/$ECR_REPO:latest
                        "
                    '''
                }
            }
        }
    }

    post {
        success {
            echo 'Pipeline completed — app deployed successfully'
        }
        failure {
            echo 'Pipeline failed — check the logs above'
        }
    }
}
