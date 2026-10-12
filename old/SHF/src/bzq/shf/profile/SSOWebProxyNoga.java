/*
 * Created on 23/03/2004
 *
 * To change the template for this generated file go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
package bzq.shf.profile;

import java.net.MalformedURLException;
import java.net.URL;

import org.apache.log4j.Logger;

import sso.web.bean.AuthorizationBean;
import bzq.general.BzqException;

import com.bezeq.NogaPermissionsWSLocator;
import com.bezeq.NogaPermissionsWSSoap;
import com.bezeq.SSOResponseObject;


/**
 * @author 05769861
 *
 * To change the template for this generated type comment go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
public class SSOWebProxyNoga {

	/**
	 * 
	 */
	public SSOWebProxyNoga() {
		super();
	}

	private String stringURL = null;
	private final String ENV_DVLP = "d";
	private final String ENV_TEST = "t";
//	private final String ENV_LERN = "t";
	private final String ENV_PROD = "p";
	private static Logger logger = Logger.getLogger(SSOWebProxyNoga.class);

	public AuthorizationBean getAuthorizationBean(
		java.lang.String id,
		java.lang.String semel,
		java.lang.String clientIp,
		String environment)
		throws BzqException, Exception {
		AuthorizationBean authorizationBean = null;

		StringBuffer sb = new StringBuffer();

		sb.append("getAuthorizationBean for user: ");
		sb.append(id);
		sb.append(" with semel ");
		sb.append(semel);
		logger.debug(sb.toString());

		//		try {
		NogaPermissionsWSLocator locator = new NogaPermissionsWSLocator();
		NogaPermissionsWSSoap ws =
			locator.getNogaPermissionsWSSoap(getEndpointURL(environment));
		SSOResponseObject response =
			ws.getAuthorizationBean(id, semel, clientIp);
//			System.out.println(id+" "+semel+" "+clientIp);
		if (response.isSuccess()) {
			authorizationBean = (AuthorizationBean) response;
		} else {
			throw new BzqException(response.getRCMicrosoft().getDescription());
		}
//		System.out.println(authorizationBean.toString());
		return authorizationBean;
	}

	private URL getEndpointURL(String environment) throws BzqException {
		environment = environment.substring(0, 1);

		URL url = null;
		try {
			if ((environment != null)
				&& (environment.equalsIgnoreCase(ENV_DVLP)
					|| environment.equalsIgnoreCase(ENV_TEST)
					|| environment.equalsIgnoreCase(ENV_PROD))) {
				//For Learn environment
				
				if (environment.equalsIgnoreCase(ENV_DVLP)) {
					environment = "";
				}
//				System.out.println(environment);
				stringURL = "http://nemowsp/nemows/NemoPermissionsWS" ; // NEMO new
//					"http://nogaws"										// NOGA old
//						+ environment
//						+ ".bezeq.com/NogaPermissionsWS.asmx";
//						//System.out.println(stringURL);
					
				url = new URL(stringURL);
			} else {
				throw new BzqException("getAuthorizationBean failed - wrong environment");
			}
		} catch (MalformedURLException e) {
			throw new BzqException("getAuthorizationBean failed - wrong environment");
		}

		return url;
	}
}
