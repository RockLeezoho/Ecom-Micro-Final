from django.apps import AppConfig

class InfrastructureConfig(AppConfig):
    name = 'modules.infrastructure'

    def ready(self):
        import modules.infrastructure.signals
