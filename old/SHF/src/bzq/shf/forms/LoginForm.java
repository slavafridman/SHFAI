/* * Created on 29/01/2008 */
package bzq.shf.forms;

import java.util.HashMap;

import bzq.shf.bean.ShfBaseBean;
/** * @author: Administrator */

public class LoginForm extends ShfBaseBean {
	private String user;
	private String password;
	private String generalAuthorization;
	private String specificAuthorization;
	private String userfirstname;
	private String userlastname;
	private String ssoMessage;
	private String ssoExtraMessage;
	private String domain_user;
	
	public LoginForm() {
		super();
	} /**	 * @return	 */
	public String getGeneralAuthorization() {
		return generalAuthorization;
	} /**	 * @return	 */
	public String getPassword() {
		return password;
	} /**	 * @return	 */
	public String getSsoExtraMessage() {
		return ssoExtraMessage;
	} /**	 * @return	 */
	public String getSsoMessage() {
		return ssoMessage;
	} /**	 * @return	 */
	public String getUser() {
		return user;
	} /**	 * @return	 */
	public String getUserfirstname() {
		return userfirstname;
	} /**	 * @return	 */
	public String getUserlastname() {
		return userlastname;
	} /**	 * @param string	 */
	public void setGeneralAuthorization(String string) {
		generalAuthorization = string;
	} /**	 * @param string	 */
	public void setPassword(String string) {
		password = string;
	} /**	 * @param string	 */
	public void setSsoExtraMessage(String string) {
		ssoExtraMessage = string;
	} /**	 * @param string	 */
	public void setSsoMessage(String string) {
		ssoMessage = string;
	} /**	 * @param string	 */
	public void setUser(String string) {
		user = string;
	} /**	 * @param string	 */
	public void setUserfirstname(String string) {
		userfirstname = string;
	} /**	 * @param string	 */
	public void setUserlastname(String string) {
		userlastname = string;
	}
	/* (non-Javadoc)
	 * @see bzq.forms.BaseForm#getFieldsMapping()
	 */
	public HashMap getFieldsMapping() {
		return null;
	}
	/**
	 * @return
	 */
	public String getSpecificAuthorization() {
		return specificAuthorization;
	}

	/**
	 * @param string
	 */
	public void setSpecificAuthorization(String string) {
		specificAuthorization = string;
	}

	/**
	 * @return
	 */
	public String getDomain_user() {
		return domain_user;
	}

	/**
	 * @param string
	 */
	public void setDomain_user(String string) {
		domain_user = string;
	}

}