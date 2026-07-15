pipeline {
    agent any

    environment {
        GHCR_CREDENTIALS_ID = 'github-registry-creds'
        GITHUB_USER         = 'thathsarabandara'
        IMAGE_NAME          = "ghcr.io/${GITHUB_USER}/05-rex-api-gateway"
        IMAGE_TAG           = "${env.BUILD_NUMBER}"
    }

    stages {

        stage('Checkout') {
            steps {
                echo 'Checking out source code from SCM...'
                checkout scm
            }
        }

        stage('Environment') {
            steps {
                echo 'Verifying runtime tools are available...'
                sh '''
                    node -v
                    npm -v
                    docker --version
                '''
            }
        }

        stage('Install Dependencies') {
            steps {
                echo 'Installing npm packages...'
                sh 'npm ci'
            }
        }

        stage('Lint') {
            steps {
                echo 'Running lint...'
                sh 'npm run lint'
            }
        }

        stage('Test') {
            steps {
                echo 'Running tests...'
                sh 'npm run test:coverage'
            }
        }

        stage('Build') {
            steps {
                echo "Building Docker image: ${IMAGE_NAME}:${IMAGE_TAG}"
                sh """
                    docker build -t ${IMAGE_NAME}:${IMAGE_TAG} .
                    docker tag  ${IMAGE_NAME}:${IMAGE_TAG} ${IMAGE_NAME}:latest
                    docker tag  ${IMAGE_NAME}:${IMAGE_TAG} ${IMAGE_NAME}:main
                """
            }
        }

        stage('Push') {
            when {
                branch 'main'
            }
            steps {
                echo "Pushing to GitHub Container Registry: ${IMAGE_NAME}"
                withCredentials([usernamePassword(
                    credentialsId: GHCR_CREDENTIALS_ID,
                    usernameVariable: 'GHCR_USER',
                    passwordVariable: 'GHCR_TOKEN'
                )]) {
                    sh """
                        echo "\${GHCR_TOKEN}" | docker login ghcr.io -u "\${GHCR_USER}" --password-stdin
                        docker push ${IMAGE_NAME}:${IMAGE_TAG}
                        docker push ${IMAGE_NAME}:latest
                        docker push ${IMAGE_NAME}:main
                        echo "Pushed ${IMAGE_NAME}:${IMAGE_TAG}, ${IMAGE_NAME}:latest, and ${IMAGE_NAME}:main"
                    """
                }
            }
        }

    }

    post {
        always {
            sh 'docker logout ghcr.io || true'
            cleanWs()
        }
        success {
            echo "Pipeline SUCCESS — ${IMAGE_NAME}:${IMAGE_TAG} is live on GHCR!"
        }
        failure {
            echo 'Pipeline FAILED — check console output above for details.'
        }
    }
}
