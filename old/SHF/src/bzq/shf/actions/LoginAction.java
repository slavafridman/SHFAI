/*
 * Created on 29/01/2008
 */
package bzq.shf.actions;
import java.util.Vector;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.log4j.Logger;
import org.apache.struts.action.Action;
import org.apache.struts.action.ActionForm;
import org.apache.struts.action.ActionForward;
import org.apache.struts.action.ActionMapping;

import sso.web.bean.AuthorizationBean;
import bzq.general.BaseException;
import bzq.shf.forms.LoginForm;
import bzq.shf.forms.MobileAuditRefForm;
import bzq.shf.model.Login;
import bzq.shf.model.PlatformModel;
import bzq.shf.profile.SSOWebProxyNoga;
import bzq.shf.profile.UserProfile;
import bzq.shf.utils.SHFConstants;
import bzq.shf.utils.ShfException;
import bzq.shf.utils.TablesConstants;
import bzq.utils.AppInfo;
import bzq.utils.AppResources;
import bzq.utils.TablesContainer;

public class LoginAction extends Action {
	private Logger logger = Logger.getLogger(LoginAction.class);	
	protected static String userList;
	
	public ActionForward perform(
	ActionMapping mapping,
	ActionForm form,
	HttpServletRequest request,
	HttpServletResponse response)
	throws java.io.IOException, javax.servlet.ServletException {
		String environment = null;
		
		AppInfo appInfo = null;
//		TODO: NOGA
		SSOWebProxyNoga ssoWebProxy = new SSOWebProxyNoga();
		AuthorizationBean authorizationBean = new AuthorizationBean();
		String user = null;
		ActionForward result = null;
		
		LoginForm loginForm = (LoginForm) form;
		Login login = new Login((LoginForm) form);
		
		//TODO: NOGA
		user = loginForm.getDomain_user();
		//user=loginForm.getUser();
		
//		// check mobile
//		String referrer1 = request.getHeader("referer");
//		if (referrer1.contains("mPlatform.do")) {
//			request.getSession().setAttribute("mobileLogin", "true");
//		}
	
		if(user==null || user.length() == 0){
			result = mapping.findForward("obtainUserId");
			logger.debug("User is null");
			return result;
		}
		
		logger.debug("Login try with user: " + user);
		
		try {  
			
			appInfo = (AppInfo) getServlet().getServletContext().getAttribute(bzq.utils.AppConstants.APP_INFO_KEY);
			
			if (appInfo == null) { 
				throw new ShfException("shf.login.noenvironment");
			}	
			environment = appInfo.getEnvironment();
			String semel = "SHF";
			String nogaSemel=getNogaSemel(semel,environment);
			
			if (environment == null)  {
				logger.debug("Environment is null");
				throw new ShfException("shf.login.noenvironment");
			}
			environment=environment.toLowerCase();
			logger.debug("Environment is: " + environment);
			String clientIp = request.getRemoteAddr();
			logger.debug("Client IP is: " + clientIp);
			
			try {
				authorizationBean = ssoWebProxy.getAuthorizationBean(user,nogaSemel,clientIp,environment);
				//System.out.println(user+"\t"+nogaSemel+"\t"+clientIp+"\t"+environment);
				loginForm.setUserfirstname(authorizationBean.getFirstName());
				loginForm.setUserlastname(authorizationBean.getLastName());
				loginForm.setGeneralAuthorization(authorizationBean.getGeneralAuthorization()[0].toUpperCase());
				//loginForm.setSpecificAuthorization(authorizationBean.getSpecificAuthorization()[0].toUpperCase());
			} catch (Exception ex) {
				logger.error(ex.getMessage());
				throw new ShfException("shf.login.failed" , ex);
			}
			
			UserProfile userProfile = login.load();
			request.getSession().setAttribute("userProfile", userProfile);
			//session idle time
			request.getSession().setMaxInactiveInterval(5400);
			
			// check and record mobile login
			if ("true".equals(request.getSession().getAttribute("isMobile")) && "true".equals(request.getSession().getAttribute("mobileLogin"))) {
				request.getSession().removeAttribute("mobileLogin");
				
				TablesContainer tablesContainer = AppResources.getInstance().getTablesContainer();
				Vector<MobileAuditRefForm> mobileAuditRef = tablesContainer.getTable(TablesConstants.MOBILE_AUDIT_REF);
				String loginActionID = "";
				for (MobileAuditRefForm mobileAuditRefForm : mobileAuditRef) {
					if (SHFConstants.ACTION_LOGIN.equals( mobileAuditRefForm.getDescription())) {
						loginActionID = mobileAuditRefForm.getCode();
						if (loginActionID != null && loginActionID != "") {
							PlatformModel pm = new PlatformModel();
							try {
								pm.insertMobileAudit(userProfile.getId(), Integer.parseInt(loginActionID));
							} catch (ShfException e) {
								logger.error("Error while inserting to MobileAudit table : " + e.getMessage() );
							}
						}
					}
				}
			}
			
			result = mapping.findForward("loginSuccessful");
		} catch (BaseException e) {
			saveErrors(request, e.getErrors());
		}
		
//		// check mobile redirect
//		if ("true".equals(request.getSession().getAttribute("mobileLogin"))) {
//			request.getSession().removeAttribute("mobileLogin");
//			response.sendRedirect("/shf/mPlatform.do");
//		}

		return result;
	}
	/**
	 * @param semel
	 * @param environment
	 * @return
	 */
	private String getNogaSemel(String semel, String environment) {
		if(semel==null || semel.length()==0 || environment==null || environment.length()==0) return null;
		String s=semel;
		if(!("P".equalsIgnoreCase(String.valueOf(environment.charAt(0))))){
			char[] arr=s.toCharArray();
			arr[2]= Character.toUpperCase(environment.charAt(0));
			s=String.valueOf(arr);
		}
		//TODO: NOGA
		return s;
		//return "SHF";
	}
}
