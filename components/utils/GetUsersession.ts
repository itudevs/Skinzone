import { Session } from "@supabase/supabase-js";
import { supabase } from "../../lib/supabase";


class UserSessionService {
    private static instance: UserSessionService;
    private currentSession: Session | null = null;
    private listeners = new Set<(session: Session | null) => void>();
    private subscription: { unsubscribe: () => void } | null = null;


    private constructor() {
        this.bootstrap();
    }

    static getInstance() {
        if (!UserSessionService.instance) {
            UserSessionService.instance = new UserSessionService();
        }
        return UserSessionService.instance;
    }

    private async bootstrap() {
        const {
            data: { session },
        } = await supabase.auth.getSession();
        this.currentSession = session ?? null;
        this.notify();
        this.subscription = supabase.auth
            .onAuthStateChange((_event, session) => {
                this.currentSession = session;
                this.notify();
            })
            .data.subscription;
    }

    private notify() {
        this.listeners.forEach((listener) => listener(this.currentSession));
    }

    getSession() {
        return this.currentSession;
    }

    onSessionChange(listener: (session: Session | null) => void) {
        this.listeners.add(listener);
        listener(this.currentSession);
        return () => this.listeners.delete(listener);
    }

    dispose() {
        this.subscription?.unsubscribe();
        this.listeners.clear();
    }
}

export const UserSession = UserSessionService.getInstance();