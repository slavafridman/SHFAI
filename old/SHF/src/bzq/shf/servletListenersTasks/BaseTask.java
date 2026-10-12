package bzq.shf.servletListenersTasks;

import javax.servlet.ServletContext;

public class BaseTask {
	
	private ServletContext servCtx = null;

	public ServletContext getServCtx() {
		return servCtx;
	}

	public void setServCtx(ServletContext servCtx) {
		this.servCtx = servCtx;
	}
	
}
